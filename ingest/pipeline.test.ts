import { describe, expect, it, vi } from 'vitest'
import type { Item, SourceConfig } from '../src/types'
import { dedupe, score, toItem } from './build'
import { enrichItems, llmEnabled, type Enricher } from './llm'
import { canonicalUrl, titleSimilarity } from './normalize'
import { fetchRepos } from './repos'
import { ruleRoles } from './tagger'

const NOW = new Date('2026-10-31T06:00:00Z')

const source = (over: Partial<SourceConfig> = {}): SourceConfig => ({
  id: 'src', name: 'Source', url: 'https://x.test', feedUrl: 'https://x.test/feed',
  type: 'article', roles: [], tier: 'editorial', kind: 'rss', ...over,
})

const item = (over: Partial<Item> = {}): Item => ({
  id: 'a', title: 'Title', url: 'https://x.test/a', sourceId: 'src', sourceName: 'Source',
  tier: 'editorial', type: 'article', publishedAt: '2026-10-30T12:00:00.000Z', firstSeenAt: '2026-10-30T13:00:00.000Z',
  roles: ['se'], tagMethod: 'rules', summary: 'Feed summary', summaryBy: 'feed', score: 1, ...over,
})

describe('canonicalUrl', () => {
  it('strips tracking params, www, trailing slash and the fragment', () => {
    expect(canonicalUrl('http://www.Example.com/post/?utm_source=rss&utm_medium=x&id=3#comments')).toBe('https://example.com/post?id=3')
  })
  it('sorts the remaining params so order does not create duplicates', () => {
    expect(canonicalUrl('https://a.test/p?b=2&a=1')).toBe(canonicalUrl('https://a.test/p?a=1&b=2'))
  })
  it('keeps the fragment when asked (release-notes day anchors)', () => {
    expect(canonicalUrl('https://docs.test/notes#october-7-2026', true)).toBe('https://docs.test/notes#october-7-2026')
  })
  it('returns unparseable input unchanged', () => {
    expect(canonicalUrl(' not a url ')).toBe('not a url')
  })
})

describe('titleSimilarity', () => {
  it('scores identical titles from different outlets as 1', () => {
    expect(titleSimilarity('Introducing Claude Haiku 5.5', 'Introducing Claude Haiku 5.5!')).toBe(1)
  })
  it('keeps version numbers as single tokens so v2.1.30 and v2.1.31 differ', () => {
    expect(titleSimilarity('Claude Code v2.1.30', 'Claude Code v2.1.31')).toBeLessThan(0.85)
  })
})

describe('ruleRoles', () => {
  it('places items from title keywords', () => {
    expect(ruleRoles('Claude Code adds Cypress test generation')).toEqual(['claude', 'qa'])
    expect(ruleRoles('Writing a better PRD with AI')).toEqual(['pm'])
  })
  it('needs two different excerpt keywords, so one passing mention is not enough', () => {
    expect(ruleRoles('Weekly roundup', 'Also: a new test')).toEqual([])
    expect(ruleRoles('Weekly roundup', 'Playwright 1.60 ships and flaky test detection improves')).toEqual(['qa'])
  })
  it('does not read "3 pm" as product management', () => {
    expect(ruleRoles('Livestream at 3 pm today')).toEqual([])
  })
})

describe('toItem', () => {
  it('combines source roles with rule roles and marks the method', () => {
    const { item, needsLlm } = toItem({ title: 'Anthropic ships a Cypress plugin', url: 'https://x.test/a?utm_source=rss', publishedAt: '2026-10-30T00:00:00Z', excerpt: '' }, source({ roles: ['qa'] }), NOW)
    expect(item.roles).toEqual(['claude', 'qa'])
    expect(item.tagMethod).toBe('rules')
    expect(item.url).toBe('https://x.test/a')
    expect(needsLlm).toBe(false)
  })
  it('falls back to the source fallback roles and flags the item for the LLM', () => {
    const { item, needsLlm } = toItem({ title: 'Thoughts on a quiet week', url: 'https://x.test/b', publishedAt: null }, source({ fallbackRoles: ['pm'] }), NOW)
    expect(item.roles).toEqual(['pm'])
    expect(item.tagMethod).toBe('source')
    expect(needsLlm).toBe(true)
  })
  it('clamps future or missing dates to now', () => {
    const { item } = toItem({ title: 'Scheduled post', url: 'https://x.test/c', publishedAt: '2027-01-01T00:00:00Z' }, source(), NOW)
    expect(item.publishedAt).toBe(NOW.toISOString())
  })
  it('cuts long feed text to a short summary (no article bodies)', () => {
    const { item } = toItem({ title: 'Long', url: 'https://x.test/d', publishedAt: null, excerpt: 'word '.repeat(200) }, source(), NOW)
    expect(item.summary.length).toBeLessThanOrEqual(180)
    expect(item.summary.endsWith('…')).toBe(true)
  })
})

describe('dedupe', () => {
  it('drops exact canonical-URL duplicates', () => {
    expect(dedupe([item(), item({ sourceId: 'other' })])).toHaveLength(1)
  })
  it('merges near-identical titles across sources, keeping the official copy and the HN link', () => {
    const official = item({ id: 'o', tier: 'official', sourceId: 'anthropic-news', title: 'Introducing Claude Haiku 5.5', roles: ['claude'] })
    const hn = item({ id: 'h', tier: 'community', sourceId: 'hn-claude', title: 'Introducing Claude Haiku 5.5', roles: ['claude', 'se'], discussionUrl: 'https://news.ycombinator.com/item?id=1' })
    const out = dedupe([hn, official])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'o', roles: ['claude', 'se'], discussionUrl: 'https://news.ycombinator.com/item?id=1' })
  })
  it('keeps same-titled items from one source (release notes) and items far apart in time', () => {
    const a = item({ id: 'a', title: 'Weekly update' })
    const b = item({ id: 'b', title: 'Weekly update' })
    const c = item({ id: 'c', sourceId: 'other', title: 'Weekly update', publishedAt: '2026-10-01T00:00:00Z' })
    expect(dedupe([a, b, c])).toHaveLength(3)
  })
})

describe('score', () => {
  it('ranks a fresh official Claude model launch above an old editorial post', () => {
    const launch = item({ tier: 'official', roles: ['claude'], title: 'Introducing Claude Haiku 5.5', publishedAt: '2026-10-31T00:00:00Z' })
    const old = item({ publishedAt: '2026-10-20T00:00:00Z' })
    expect(score(launch, NOW)).toBeGreaterThan(score(old, NOW) + 5)
  })
})

describe('LLM enrichment', () => {
  it('is off unless both ENABLE_LLM=true and a key are present', () => {
    expect(llmEnabled({})).toBe(false)
    expect(llmEnabled({ ENABLE_LLM: 'true' })).toBe(false)
    expect(llmEnabled({ ANTHROPIC_API_KEY: 'k' })).toBe(false)
    expect(llmEnabled({ ENABLE_LLM: 'true', ANTHROPIC_API_KEY: 'k' })).toBe(true)
  })

  it('adds summary and why, and only overrides roles for unplaced items', async () => {
    const placed = item({ id: 'p', roles: ['qa'] })
    const unplaced = item({ id: 'u', roles: ['se'], tagMethod: 'source' })
    const enricher = vi.fn<Enricher>(async (batch) =>
      batch.map((b) => ({ id: b.id, roles: ['pm' as const], summary: `LLM says ${b.id}`, why: 'Because.' })),
    )
    const out = await enrichItems([placed, unplaced], new Set(['u']), enricher, { log: () => {} })
    expect(out.find((i) => i.id === 'p')).toMatchObject({ roles: ['qa'], summary: 'LLM says p', summaryBy: 'llm', whyItMatters: 'Because.' })
    expect(out.find((i) => i.id === 'u')).toMatchObject({ roles: ['pm'], tagMethod: 'llm' })
  })

  it('sends only a short excerpt, never more than 300 characters', async () => {
    const enricher: Enricher = vi.fn(async () => [])
    await enrichItems([item({ summary: 'x'.repeat(1000) })], new Set(), enricher, { log: () => {} })
    expect(vi.mocked(enricher).mock.calls[0][0][0].excerpt.length).toBeLessThanOrEqual(300)
  })

  it('leaves items untouched when the LLM call fails', async () => {
    const before = [item()]
    const out = await enrichItems(before, new Set(), async () => { throw new Error('boom') }, { log: () => {} })
    expect(out).toEqual(before)
  })

  it('skips items that already have an LLM summary', async () => {
    const enricher: Enricher = vi.fn(async () => [])
    await enrichItems([item({ summaryBy: 'llm' })], new Set(), enricher, { log: () => {} })
    expect(enricher).not.toHaveBeenCalled()
  })
})

describe('fetchRepos', () => {
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

  it('records stars, last push and license with a verified date', async () => {
    const { repos } = await fetchRepos([{ fullName: 'o/r', why: 'w', roles: ['qa'] }], NOW, undefined, async () =>
      ok({ stargazers_count: 1234, pushed_at: '2026-10-30T00:00:00Z', archived: false, html_url: 'https://github.com/o/r', license: { spdx_id: 'MIT' } }),
    )
    expect(repos[0]).toMatchObject({ stars: 1234, lastCommit: '2026-10-30T00:00:00Z', license: 'MIT', archived: false, verifiedAt: NOW.toISOString() })
  })

  it('shows not-verified (nulls) when the API fails, instead of a guessed number', async () => {
    const { repos, failures } = await fetchRepos([{ fullName: 'o/r', why: 'w', roles: ['qa'] }], NOW, undefined, async () => ({ ok: false, status: 403, json: async () => ({}) }))
    expect(repos[0]).toMatchObject({ stars: null, verifiedAt: null })
    expect(failures[0]).toContain('HTTP 403')
  })

  it('treats NOASSERTION as no known license', async () => {
    const { repos } = await fetchRepos([{ fullName: 'o/r', why: 'w', roles: ['pm'] }], NOW, undefined, async () => ok({ stargazers_count: 1, license: { spdx_id: 'NOASSERTION' } }))
    expect(repos[0].license).toBeNull()
  })
})
