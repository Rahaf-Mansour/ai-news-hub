import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ItemsFile, ReposFile, SourceConfig, SourcesStatusFile } from '../src/types'
import { runIngest } from './run'

const NOW = new Date('2026-10-31T06:00:00Z')
const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')

const sources: SourceConfig[] = [
  { id: 'blog', name: 'Fixture blog', url: 'https://blog.example.com', feedUrl: 'https://blog.example.com/rss', type: 'article', roles: ['qa'], tier: 'official', kind: 'rss' },
  { id: 'broken', name: 'Broken feed', url: 'https://down.example.com', feedUrl: 'https://down.example.com/rss', type: 'news', roles: ['se'], tier: 'editorial', kind: 'rss' },
  { id: 'notes', name: 'Release notes', url: 'https://docs.example.com', feedUrl: 'https://docs.example.com/notes', type: 'release', roles: ['claude'], tier: 'official', kind: 'claude-release-notes' },
]

const fetchText = async (url: string) => {
  if (url.includes('down.example.com')) throw new Error('HTTP 503 for https://down.example.com/rss')
  if (url.includes('blog.example.com')) return fixture('blog.rss')
  return fixture('release-notes.html')
}
const fetchJson = async () => ({ ok: false, status: 403, json: async () => ({}) })

let root: string
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('runIngest', () => {
  it('skips a failing source, logs it, and still writes the site data', async () => {
    root = mkdtempSync(join(tmpdir(), 'hub-'))
    const logs: string[] = []
    const result = await runIngest({ root, sources, now: NOW, fetchText, fetchJson, env: {}, log: (m) => logs.push(m) })

    expect(result.ok).toBe(2)
    expect(result.failed.map((f) => f.id)).toEqual(['broken'])
    expect(logs.some((l) => l.includes('FAIL') && l.includes('broken'))).toBe(true)

    const items = JSON.parse(readFileSync(join(root, 'public/data/items.json'), 'utf8')) as ItemsFile
    expect(items.llmEnabled).toBe(false)
    // The Sep 28 release note is outside the 30-day window: archived, not in items.json.
    expect(items.items.map((i) => i.sourceId).sort()).toEqual(['blog', 'notes'])

    const status = JSON.parse(readFileSync(join(root, 'public/data/sources-status.json'), 'utf8')) as SourcesStatusFile
    expect(status.sources.find((s) => s.id === 'broken')).toMatchObject({ ok: false, count: 0, lastSuccess: null })
    expect(status.sources.find((s) => s.id === 'blog')).toMatchObject({ ok: true, count: 1 })

    const repos = JSON.parse(readFileSync(join(root, 'public/data/repos.json'), 'utf8')) as ReposFile
    expect(repos.repos.every((r) => r.stars === null && r.verifiedAt === null)).toBe(true)

    expect(readdirSync(join(root, 'data/archive')).sort()).toEqual(['2026-09.json', '2026-10.json'])
  })

  it('keeps items and their first-seen time across runs (archive persists)', async () => {
    root = mkdtempSync(join(tmpdir(), 'hub-'))
    await runIngest({ root, sources, now: NOW, fetchText, fetchJson, env: {}, log: () => {} })
    const later = new Date('2026-11-01T06:00:00Z')
    const second = await runIngest({ root, sources, now: later, fetchText, fetchJson, env: {}, log: () => {} })
    expect(second.newItems).toBe(0)
    const items = JSON.parse(readFileSync(join(root, 'public/data/items.json'), 'utf8')) as ItemsFile
    expect(items.items.every((i) => i.firstSeenAt === NOW.toISOString())).toBe(true)
  })

  it('leaves existing data untouched when every source fails', async () => {
    root = mkdtempSync(join(tmpdir(), 'hub-'))
    const result = await runIngest({ root, sources: [sources[1]], now: NOW, fetchText, fetchJson, env: {}, log: () => {} })
    expect(result.ok).toBe(0)
    expect(readdirSync(join(root, 'public/data'))).toEqual([])
  })

  it('uses the LLM enricher only when enabled', async () => {
    root = mkdtempSync(join(tmpdir(), 'hub-'))
    let calls = 0
    await runIngest({
      root, sources, now: NOW, fetchText, fetchJson, log: () => {},
      env: { ENABLE_LLM: 'true', ANTHROPIC_API_KEY: 'test' },
      enricher: async (batch) => {
        calls++
        return batch.map((b) => ({ id: b.id, roles: [], summary: 'Short summary.', why: 'Relevant to QA.' }))
      },
    })
    expect(calls).toBe(1)
    const items = JSON.parse(readFileSync(join(root, 'public/data/items.json'), 'utf8')) as ItemsFile
    expect(items.llmEnabled).toBe(true)
    expect(items.items.every((i) => i.summaryBy === 'llm' && i.whyItMatters === 'Relevant to QA.')).toBe(true)
  })
})
