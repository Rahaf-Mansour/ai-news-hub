import { describe, expect, it } from 'vitest'
import type { Item, Repo } from '../types'
import { countUnread, EMPTY_FILTER, filterItems, matchesRepo, matchesStep } from './filter'
import { formatStars, relativeDate } from './format'
import { savedMarkdown } from './saved'
import { selectToday } from './today'

const NOW = new Date('2026-10-31T06:00:00Z')
let n = 0
const item = (over: Partial<Item> = {}): Item => ({
  id: `i${++n}`, title: 'Title', url: `https://x.test/${n}`, sourceId: `s${n}`, sourceName: 'Source',
  tier: 'editorial', type: 'article', publishedAt: '2026-10-30T12:00:00.000Z', firstSeenAt: '2026-10-30T12:00:00.000Z',
  roles: ['se'], tagMethod: 'rules', summary: '', summaryBy: 'feed', score: 1, ...over,
})

describe('selectToday', () => {
  it('returns at most 8 items with the highest-scored as lead', () => {
    const items = Array.from({ length: 20 }, (_, i) => item({ score: i }))
    const view = selectToday(items, NOW)
    expect(view.count).toBe(8)
    expect(view.lead?.score).toBe(19)
    expect(view.windowLabel).toBe('48 hours')
  })

  it('represents every role that has news, even when one role has higher scores', () => {
    const se = Array.from({ length: 10 }, (_, i) => item({ roles: ['se'], score: 10 + i }))
    const qa = item({ roles: ['qa'], score: 1 })
    const pm = item({ roles: ['pm'], score: 1 })
    const view = selectToday([...se, qa, pm], NOW)
    const shown = [view.lead, ...view.groups.flatMap((g) => g.items)]
    expect(shown).toContain(qa)
    expect(shown).toContain(pm)
  })

  it('gives every one of the five lenses a slot, Full-stack included', () => {
    const se = Array.from({ length: 10 }, (_, i) => item({ roles: ['se'], score: 10 + i }))
    const lenses = (['claude', 'qa', 'pm', 'fs'] as const).map((r) => item({ roles: [r], score: 1 }))
    const view = selectToday([...se, ...lenses], NOW)
    // The lead is the top SE item; the groups still show every lens, in display order.
    expect(view.groups.map((g) => g.role)).toEqual(['claude', 'qa', 'pm', 'fs', 'se'])
  })

  it('caps each role at three items when other roles have news', () => {
    const claude = Array.from({ length: 8 }, () => item({ roles: ['claude'], score: 50 }))
    const others = Array.from({ length: 8 }, (_, i) => item({ roles: [(['se', 'pm', 'qa'] as const)[i % 3]], score: i }))
    const view = selectToday([...claude, ...others], NOW)
    const shown = [view.lead!, ...view.groups.flatMap((g) => g.items)]
    expect(shown.filter((i) => i.roles[0] === 'claude')).toHaveLength(3)
    expect(view.count).toBe(8)
  })

  it('takes at most one item per source when there is enough choice', () => {
    const busy = Array.from({ length: 6 }, () => item({ sourceId: 'busy', score: 50 }))
    const others = Array.from({ length: 6 }, (_, i) => item({ score: i }))
    const view = selectToday([...busy, ...others], NOW)
    const shown = [view.lead!, ...view.groups.flatMap((g) => g.items)]
    expect(shown.filter((i) => i.sourceId === 'busy')).toHaveLength(1)
  })

  it('widens to 7 days on a quiet day and groups Claude first', () => {
    const items = [
      item({ roles: ['qa'], publishedAt: '2026-10-27T00:00:00Z', score: 9 }),
      item({ roles: ['claude'], publishedAt: '2026-10-26T00:00:00Z', score: 3 }),
      item({ roles: ['claude'], publishedAt: '2026-10-25T00:00:00Z', score: 2 }),
    ]
    const view = selectToday(items, NOW)
    expect(view.windowLabel).toBe('7 days')
    expect(view.groups[0].role).toBe('claude')
  })

  it('handles an empty feed', () => {
    expect(selectToday([], NOW)).toMatchObject({ lead: null, groups: [], count: 0 })
  })
})

describe('filterItems', () => {
  const a = item({ title: 'Cypress adds cy.prompt', roles: ['qa'], tier: 'official', type: 'release' })
  const b = item({ title: 'PRD templates with Claude', roles: ['pm', 'claude'], summary: 'Discovery work' })
  const all = [a, b]

  it('filters by role tab', () => {
    expect(filterItems(all, 'qa', EMPTY_FILTER, new Set(), new Set())).toEqual([a])
  })
  it('searches title and summary, requiring every word', () => {
    expect(filterItems(all, null, { ...EMPTY_FILTER, query: 'claude discovery' }, new Set(), new Set())).toEqual([b])
    expect(filterItems(all, null, { ...EMPTY_FILTER, query: 'claude cypress' }, new Set(), new Set())).toEqual([])
  })
  it('filters by tier, type, hide-read and saved-only, and combines the last two', () => {
    expect(filterItems(all, null, { ...EMPTY_FILTER, tiers: ['official'] }, new Set(), new Set())).toEqual([a])
    expect(filterItems(all, null, { ...EMPTY_FILTER, types: ['article'] }, new Set(), new Set())).toEqual([b])
    expect(filterItems(all, null, { ...EMPTY_FILTER, hideRead: true }, new Set([a.id]), new Set())).toEqual([b])
    expect(filterItems(all, null, { ...EMPTY_FILTER, savedOnly: true }, new Set(), new Set([a.id]))).toEqual([a])
    expect(filterItems(all, null, { ...EMPTY_FILTER, hideRead: true, savedOnly: true }, new Set([a.id]), new Set([a.id]))).toEqual([])
  })
  it('counts unread per role', () => {
    expect(countUnread(all, new Set([a.id]))).toBe(1)
    expect(countUnread(all, new Set([a.id]), 'qa')).toBe(0)
  })
})

describe('matchesRepo and matchesStep', () => {
  const repo: Repo = {
    fullName: 'microsoft/playwright-mcp', why: 'Give an agent a browser.', roles: ['qa', 'se'], note: 'Apache licensed',
    url: 'u', stars: 1, lastCommit: null, archived: false, license: 'Apache-2.0', verifiedAt: null,
  }
  it('matches repo name, why line, license and role labels, every word required', () => {
    expect(matchesRepo(repo, 'playwright')).toBe(true)
    expect(matchesRepo(repo, 'agent browser')).toBe(true)
    expect(matchesRepo(repo, 'apache-2.0')).toBe(true)
    expect(matchesRepo(repo, 'qa')).toBe(true)
    expect(matchesRepo(repo, 'playwright cypress')).toBe(false)
    expect(matchesRepo(repo, '')).toBe(true)
  })
  const step = { id: 's', title: 'cy.prompt basics', url: 'u', source: 'Cypress blog', minutes: 5, why: 'Plain English tests.' }
  it('matches step title, source, why and the track name', () => {
    expect(matchesStep(step, 'QA in the AI era', 'cypress english')).toBe(true)
    expect(matchesStep(step, 'QA in the AI era', 'era')).toBe(true)
    expect(matchesStep(step, 'QA in the AI era', 'playwright')).toBe(false)
  })
})

describe('savedMarkdown', () => {
  it('lists saved items, repos and steps under headings, escaping brackets in titles', () => {
    const md = savedMarkdown(
      [item({ title: 'Claude [beta] notes', url: 'https://a.test/x', sourceName: 'Anthropic News' })],
      [{ fullName: 'o/r', url: 'https://github.com/o/r', why: 'Useful.', roles: ['qa'] }],
      [{ title: 'Evals 101', url: 'https://e.test', source: 'Anthropic', why: 'w', track: 'QA' }],
    )
    expect(md).toContain('- [Claude \\[beta\\] notes](https://a.test/x) — Anthropic News')
    expect(md).toContain('### Repos\n- [o/r](https://github.com/o/r) — Useful.')
    expect(md).toContain('### Learning steps\n- [Evals 101](https://e.test) — Anthropic')
  })
  it('is empty when nothing is saved', () => {
    expect(savedMarkdown([], [], [])).toBe('')
  })
})

describe('format', () => {
  it('formats star counts compactly', () => {
    expect(formatStars(154027)).toBe('154k')
    expect(formatStars(9727)).toBe('9.7k')
    expect(formatStars(2000)).toBe('2k')
    expect(formatStars(167)).toBe('167')
  })
  it('formats recent dates relatively', () => {
    expect(relativeDate('2026-10-31T05:00:00Z', NOW)).toBe('1h ago')
    expect(relativeDate('2026-10-31T05:50:00Z', NOW)).toBe('10m ago')
  })
})
