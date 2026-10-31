import type { Item, RawItem, Role, SourceConfig, TrustTier } from '../src/types'
import { canonicalUrl, itemId, titleSimilarity } from './normalize'
import { ruleAreas, ruleRoles, sortRoles } from './tagger'
import { stripLeadingEmoji, truncate } from './text'

export const SUMMARY_MAX = 180

/**
 * Turn an adapter's raw item into a site item: canonical URL, tags from the
 * source and the keyword rules, and a short summary cut from the feed text.
 * `needsLlm` marks items that only got roles from a source fallback.
 */
export function toItem(raw: RawItem, source: SourceConfig, now: Date): { item: Item; needsLlm: boolean } {
  const url = canonicalUrl(raw.url, source.kind === 'claude-release-notes')
  const matched = ruleRoles(raw.title, raw.excerpt)
  let roles: Role[] = sortRoles([...source.roles, ...matched])
  let tagMethod: Item['tagMethod'] = matched.some((r) => !source.roles.includes(r)) ? 'rules' : 'source'
  let needsLlm = false
  if (!roles.length) {
    roles = sortRoles(source.fallbackRoles ?? ['se'])
    tagMethod = 'source'
    needsLlm = true
  }

  // Never show a date in the future (some feeds publish scheduled posts early).
  const published = raw.publishedAt && raw.publishedAt < now.toISOString() ? raw.publishedAt : now.toISOString()

  return {
    needsLlm,
    item: {
      id: itemId(url),
      title: raw.title,
      url,
      sourceId: source.id,
      sourceName: source.name,
      tier: source.tier,
      type: source.type,
      publishedAt: published,
      firstSeenAt: now.toISOString(),
      roles,
      tagMethod,
      summary: truncate(stripLeadingEmoji(raw.excerpt ?? ''), SUMMARY_MAX),
      summaryBy: 'feed',
      discussionUrl: raw.discussionUrl,
      score: 0,
    },
  }
}

const TIER_RANK: Record<TrustTier, number> = { official: 3, editorial: 2, community: 1 }

/**
 * Remove duplicates: same canonical URL, or near-identical titles (token
 * Jaccard ≥ 0.85) from different sources published within three days of each
 * other. The copy from the higher trust tier wins; roles are merged and a
 * Hacker News discussion link is carried over.
 */
export function dedupe(items: Item[], threshold = 0.85): Item[] {
  const kept: Item[] = []
  const sorted = [...items].sort(
    (a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || a.firstSeenAt.localeCompare(b.firstSeenAt),
  )
  for (const item of sorted) {
    const dup = kept.find(
      (k) =>
        k.id === item.id ||
        (k.sourceId !== item.sourceId &&
          Math.abs(Date.parse(k.publishedAt) - Date.parse(item.publishedAt)) <= 3 * 86_400_000 &&
          titleSimilarity(k.title, item.title) >= threshold),
    )
    if (!dup) {
      kept.push({ ...item })
      continue
    }
    dup.roles = sortRoles([...dup.roles, ...item.roles])
    dup.discussionUrl ??= item.discussionUrl
    if (item.firstSeenAt < dup.firstSeenAt) dup.firstSeenAt = item.firstSeenAt
    if (dup.summaryBy !== 'llm' && item.summaryBy === 'llm') {
      dup.summary = item.summary
      dup.summaryBy = 'llm'
      dup.whyItMatters = item.whyItMatters
    }
  }
  return kept
}

/**
 * Importance score for ordering and for the Today view: trust tier, recency
 * (half-life of about a day and a half), a boost for Claude items and model
 * or product launches, and a small boost for items that also hit HN.
 */
export function score(item: Item, now: Date): number {
  const ageHours = Math.max(0, (now.getTime() - Date.parse(item.publishedAt)) / 3_600_000)
  let s = TIER_RANK[item.tier] + 4 * Math.exp(-ageHours / 36)
  if (item.roles.includes('claude')) s += 1.5
  if (/\b(introducing|launch\w*|generally available|now available|public beta|released?)\b/i.test(item.title)) s += 1
  if (/\bclaude (opus|sonnet|haiku|fable|mythos) \d/i.test(item.title)) s += 2
  if (item.discussionUrl && item.tier !== 'community') s += 0.5
  // Routine patch releases (x.y.z with z > 0) are useful in their tab but should not crowd Today.
  if (item.type === 'release' && /\bv?\d+\.\d+\.[1-9]\d*\b/.test(item.title)) s -= 2.5
  return Math.round(s * 100) / 100
}

const VERSION = /\bv?(\d+)\.(\d+)\.(\d+)\b/

/**
 * Release feeds can publish a patch a day. Within one source, releases that
 * differ only in the patch number (1.0.258 … 1.0.266) collapse to the newest,
 * whose summary notes "+N earlier patches". Applied to the reading window
 * only; the archive keeps every release.
 */
export function collapsePatchReleases(items: Item[]): Item[] {
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    const m = item.type === 'release' ? VERSION.exec(item.title) : null
    if (!m) continue
    const key = `${item.sourceId}@${m[1]}.${m[2]}`
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const drop = new Set<string>()
  const replace = new Map<string, Item>()
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const [newest, ...older] = [...group].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    older.forEach((i) => drop.add(i.id))
    const note = `+${older.length} earlier patch${older.length === 1 ? '' : 'es'}`
    replace.set(newest.id, { ...newest, summary: newest.summary ? `${newest.summary} (${note})` : note })
  }
  return items.filter((i) => !drop.has(i.id)).map((i) => replace.get(i.id) ?? i)
}

/**
 * Re-apply the current source config and keyword rules to an item, so a
 * config change (say, dropping a role from a source) applies to the whole
 * reading window at once, not only to items fetched after it. LLM-assigned
 * roles are kept. Areas are always recomputed.
 */
export function retag(item: Item, source: SourceConfig | undefined): Item {
  let roles = item.roles
  if (source && item.tagMethod !== 'llm') {
    const matched = ruleRoles(item.title, item.summary)
    roles = sortRoles([...source.roles, ...matched])
    if (!roles.length) roles = sortRoles(source.fallbackRoles ?? item.roles)
  }
  // Summary clean-up also applies to items archived before it existed.
  const summary = stripLeadingEmoji(item.summary)
  return { ...item, summary, roles, areas: ruleAreas(item.title, summary, roles, source?.areas) }
}
