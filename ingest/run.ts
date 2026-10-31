import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Item, ItemsFile, RawItem, ReposFile, SourceConfig, SourcesStatusFile, SourceStatus } from '../src/types'
import { fetchSource } from './adapters'
import { loadArchive, readJson, writeArchive, writeJson } from './archive'
import { collapsePatchReleases, dedupe, retag, score, toItem } from './build'
import { fetchText as defaultFetchText, type TextFetcher } from './http'
import { createClaudeEnricher, enrichItems, llmEnabled, type Enricher } from './llm'
import { fetchRepos, type JsonFetcher } from './repos'
import { REPOS } from './repos.config'
import { SOURCES } from './sources'

export const WINDOW_DAYS = 30

export interface RunOptions {
  root: string
  sources?: SourceConfig[]
  now?: Date
  fetchText?: TextFetcher
  fetchJson?: JsonFetcher
  env?: NodeJS.ProcessEnv
  enricher?: Enricher
  log?: (msg: string) => void
  concurrency?: number
}

export interface RunResult {
  ok: number
  failed: SourceStatus[]
  items: number
  newItems: number
}

/**
 * One daily run: fetch every source (each in isolation), merge into the
 * monthly archive, optionally enrich with the LLM, and write the three JSON
 * files the site reads. A failing source is logged and skipped.
 */
export async function runIngest(opts: RunOptions): Promise<RunResult> {
  const {
    root,
    sources = SOURCES,
    now = new Date(),
    fetchText = defaultFetchText,
    env = process.env,
    log = console.log,
    concurrency = 6,
  } = opts
  const archiveDir = join(root, 'data', 'archive')
  const publicDir = join(root, 'public', 'data')
  mkdirSync(publicDir, { recursive: true })

  const previousStatus = readJson<SourcesStatusFile>(join(publicDir, 'sources-status.json'))
  const lastSuccessOf = (id: string) => previousStatus?.sources.find((s) => s.id === id)?.lastSuccess ?? null

  // 1. Fetch, each source isolated.
  const fetched = await mapLimit(sources, concurrency, async (source) => {
    const started = new Date().toISOString()
    try {
      const raw = await fetchSource(source, fetchText, now)
      return { source, raw, status: statusOf(source, true, started, started, raw.length) }
    } catch (err) {
      const message = String((err as Error)?.message ?? err).slice(0, 300)
      return { source, raw: [] as RawItem[], status: statusOf(source, false, started, lastSuccessOf(source.id), 0, message) }
    }
  })
  for (const f of fetched) {
    log(`${f.status.ok ? 'ok  ' : 'FAIL'} ${f.source.id.padEnd(28)} ${f.status.ok ? `${f.status.count} items` : f.status.error}`)
  }
  const statuses = fetched.map((f) => f.status)
  const failed = statuses.filter((s) => !s.ok)
  // Never wipe the published data (or spend LLM calls) when every source failed: likely a network problem.
  if (failed.length === sources.length) {
    log('Every source failed; leaving existing data untouched.')
    return { ok: 0, failed, items: 0, newItems: 0 }
  }

  // 2. Build items and merge with the archive.
  const unplaced = new Set<string>()
  const incoming: Item[] = []
  for (const { source, raw } of fetched) {
    for (const r of raw) {
      const { item, needsLlm } = toItem(r, source, now)
      incoming.push(item)
      if (needsLlm) unplaced.add(item.id)
    }
  }
  const archive = loadArchive(archiveDir)
  const known = new Set(archive.map((i) => i.id))
  let merged = dedupe([...archive, ...incoming])
  const newItems = merged.filter((i) => !known.has(i.id)).length

  // 3. Score the reading window and, if enabled, enrich it.
  const cutoff = now.getTime() - WINDOW_DAYS * 86_400_000
  const sourceById = new Map(sources.map((s) => [s.id, s]))
  let recent = merged
    .filter((i) => Date.parse(i.publishedAt) >= cutoff)
    .map((i) => retag(i, sourceById.get(i.sourceId)))
    .map((i) => ({ ...i, score: score(i, now) }))

  const useLlm = llmEnabled(env)
  if (useLlm) {
    recent = await enrichItems(recent, unplaced, opts.enricher ?? createClaudeEnricher(), { log })
    const enriched = new Map(recent.map((i) => [i.id, i]))
    merged = merged.map((i) => enriched.get(i.id) ?? i)
  } else {
    log('LLM step off (set ENABLE_LLM=true and ANTHROPIC_API_KEY to turn it on)')
  }

  // 4. Write.
  const months = writeArchive(archiveDir, merged)
  // Collapse runs of patch releases for reading only (after the archive is written, so it keeps them all).
  recent = collapsePatchReleases(recent)
  recent.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.score - a.score)
  const itemsFile: ItemsFile = { generatedAt: now.toISOString(), llmEnabled: useLlm, windowDays: WINDOW_DAYS, items: recent }
  writeJson(join(publicDir, 'items.json'), itemsFile)
  writeJson(join(publicDir, 'sources-status.json'), { generatedAt: now.toISOString(), sources: statuses } satisfies SourcesStatusFile)

  const previousRepos = readJson<ReposFile>(join(publicDir, 'repos.json'))?.repos ?? []
  const { repos, failures } = await fetchRepos(REPOS, now, env.GITHUB_TOKEN, opts.fetchJson, previousRepos)
  for (const f of failures) log(`repo not verified: ${f}`)
  writeJson(join(publicDir, 'repos.json'), { generatedAt: now.toISOString(), repos } satisfies ReposFile)

  log(`\n${statuses.length - failed.length}/${statuses.length} sources ok · ${recent.length} items in the last ${WINDOW_DAYS} days · ${newItems} new · archive months ${months.join(', ')}`)
  return { ok: statuses.length - failed.length, failed, items: recent.length, newItems }
}

function statusOf(source: SourceConfig, ok: boolean, lastFetched: string, lastSuccess: string | null, count: number, error?: string): SourceStatus {
  return { id: source.id, name: source.name, url: source.url, tier: source.tier, type: source.type, ok, lastFetched, lastSuccess, count, ...(error ? { error } : {}) }
}

async function mapLimit<T, R>(list: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(list.length)
  let next = 0
  const worker = async () => {
    while (next < list.length) {
      const i = next++
      out[i] = await fn(list[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))
  return out
}

// CLI entry: `npm run ingest`
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  runIngest({ root })
    .then((r) => {
      if (r.ok === 0) process.exitCode = 1
    })
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
}
