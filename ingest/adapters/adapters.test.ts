import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { SourceConfig } from '../../src/types'
import { parseAnthropicCards, parseReleaseNotes } from './anthropic'
import { buildHnUrl, parseHn } from './hn'
import { fetchSource } from './index'
import { labelRelease, parseFeed } from './rss'

const fixture = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')

describe('parseAnthropicCards', () => {
  const news = parseAnthropicCards(fixture('anthropic-news.html'), 'https://www.anthropic.com/news', '^/(news/[a-z0-9-]+|claude-[a-z0-9-]+)$')

  it('finds dated cards and resolves absolute URLs', () => {
    expect(news.map((i) => i.url).sort()).toEqual([
      'https://www.anthropic.com/claude-test-model-9',
      'https://www.anthropic.com/news/fixture-skills-foundation',
    ])
  })

  it('reads the date from the card container', () => {
    const skills = news.find((i) => i.url.endsWith('fixture-skills-foundation'))!
    expect(skills.title).toBe('Donating a fixture standard to a foundation')
    expect(skills.publishedAt).toBe('2026-10-22T12:00:00.000Z')
  })

  it('merges the hero and list copies of the same article, keeping the excerpt', () => {
    const model = news.filter((i) => i.url.endsWith('claude-test-model-9'))
    expect(model).toHaveLength(1)
    expect(model[0].excerpt).toBe('Our fastest small test model.')
    expect(model[0].publishedAt).toBe('2026-10-07T12:00:00.000Z')
  })

  it('drops undated cards, category links and off-site links', () => {
    expect(news.some((i) => i.url.includes('undated'))).toBe(false)
    expect(news.some((i) => i.url.includes('announcements'))).toBe(false)
    expect(news.some((i) => i.url.includes('example.com'))).toBe(false)
  })

  it('handles the engineering layout where the first link is an image', () => {
    const eng = parseAnthropicCards(fixture('anthropic-engineering.html'), 'https://www.anthropic.com/engineering', '^/(engineering|research)/[a-z0-9-]+$')
    expect(eng).toHaveLength(2)
    expect(eng.find((i) => i.url.endsWith('fixture-source-control'))).toMatchObject({
      title: 'Rethinking fixture source control',
      publishedAt: '2026-10-13T12:00:00.000Z',
    })
  })
})

describe('parseReleaseNotes', () => {
  const items = parseReleaseNotes(fixture('release-notes.html'), 'https://platform.claude.com/docs/en/release-notes/overview')

  it('emits one item per dated heading and ignores non-date headings and the TOC', () => {
    expect(items).toHaveLength(2)
  })

  it('leads with a launch even when it is not listed first, and links to the day anchor', () => {
    expect(items[0]).toMatchObject({
      title: 'We’ve launched Claude Test Model 9 (claude-test-9), our fastest fixture model.',
      url: 'https://platform.claude.com/docs/en/release-notes/overview#october-7-2026',
      publishedAt: '2026-10-07T12:00:00.000Z',
    })
    expect(items[0].excerpt).toContain('(+1 more)')
  })
})

describe('parseFeed', () => {
  it('parses RSS, strips HTML from the excerpt and skips items without links', async () => {
    const items = await parseFeed(fixture('blog.rss'))
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'Writing end-to-end tests in plain English',
      publishedAt: '2026-10-30T14:00:00.000Z',
    })
    expect(items[0].excerpt).toBe('Natural-language steps become real test commands, with self-healing selectors.')
  })

  it('parses GitHub release Atom feeds', async () => {
    const items = await parseFeed(fixture('github-releases.atom'))
    expect(items.map((i) => i.title)).toEqual(['v2.1.30', 'v2.2.0-alpha.1'])
  })

  it('rejects an HTML page served with a 200', async () => {
    await expect(parseFeed('<!DOCTYPE html><html><body>Not found</body></html>')).rejects.toThrow(/not an RSS/)
  })
})

describe('labelRelease', () => {
  it('prefixes the product name to bare version titles', () => {
    expect(labelRelease({ title: 'v2.1.30', url: 'u', publishedAt: null }, 'Claude Code')?.title).toBe('Claude Code v2.1.30')
  })
  it('leaves titles that already name the product', () => {
    expect(labelRelease({ title: 'Playwright v1.60.0', url: 'u', publishedAt: null }, 'Playwright')?.title).toBe('Playwright v1.60.0')
  })
  it('drops pre-releases that match the skip pattern', () => {
    expect(labelRelease({ title: 'v1.61.0-alpha', url: 'u', publishedAt: null }, 'Playwright', '(alpha|beta)')).toBeNull()
  })
})

describe('Hacker News', () => {
  it('builds an Algolia URL with optional words, points and a time window', () => {
    const url = new URL(buildHnUrl('https://hn.algolia.com/api/v1/search', 'Claude Anthropic', 50, new Date('2026-10-31T00:00:00Z'), 48))
    expect(url.searchParams.get('optionalWords')).toBe('Claude Anthropic')
    expect(url.searchParams.get('numericFilters')).toBe(`created_at_i>${Date.parse('2026-10-29T00:00:00Z') / 1000},points>=50`)
  })

  it('maps hits, falling back to the discussion URL for Ask HN posts', () => {
    const items = parseHn(fixture('hn.json'))
    expect(items).toHaveLength(2)
    expect(items[0].discussionUrl).toBe('https://news.ycombinator.com/item?id=41000001')
    expect(items[1].url).toBe('https://news.ycombinator.com/item?id=41000002')
  })
})

describe('fetchSource', () => {
  const source: SourceConfig = {
    id: 'tool-releases', name: 'Tool releases', url: 'https://github.com/example/tool', feedUrl: 'https://example.com/feed',
    type: 'release', roles: ['qa'], tier: 'official', kind: 'github-releases', skipTitlePattern: 'alpha',
  }

  it('labels releases, drops skipped tags and sorts newest first', async () => {
    const items = await fetchSource(source, async () => fixture('github-releases.atom'), new Date())
    expect(items.map((i) => i.title)).toEqual(['Tool v2.1.30'])
  })

  it('throws when a page parses to zero items, so a markup change is visible', async () => {
    await expect(
      fetchSource({ ...source, kind: 'anthropic-cards', hrefPattern: '^/news/' }, async () => '<html></html>', new Date()),
    ).rejects.toThrow(/parsed 0 items/)
  })
})
