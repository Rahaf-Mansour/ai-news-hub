import type { RawItem } from '../../src/types'
import { cleanText } from '../text'

interface HnHit {
  objectID: string
  title?: string
  url?: string | null
  created_at?: string
  points?: number
  story_text?: string | null
}

/** Build an Algolia search URL: any of the query words, stories only, recent and above a point threshold. */
export function buildHnUrl(base: string, query: string, minPoints: number, now: Date, hours = 72): string {
  const since = Math.floor(now.getTime() / 1000) - hours * 3600
  const params = new URLSearchParams({
    query,
    optionalWords: query,
    tags: 'story',
    numericFilters: `created_at_i>${since},points>=${minPoints}`,
    hitsPerPage: '15',
  })
  return `${base}?${params.toString()}`
}

export function parseHn(json: string): RawItem[] {
  const data = JSON.parse(json) as { hits?: HnHit[] }
  return (data.hits ?? [])
    .filter((h) => h.title)
    .map((h) => {
      const discussionUrl = `https://news.ycombinator.com/item?id=${h.objectID}`
      return {
        title: cleanText(h.title),
        // Ask HN / Show HN posts without a link point at the discussion itself.
        url: h.url || discussionUrl,
        publishedAt: h.created_at ?? null,
        excerpt: h.points ? `${h.points} points on Hacker News.` : cleanText(h.story_text),
        discussionUrl,
      }
    })
}
