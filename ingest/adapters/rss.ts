import Parser from 'rss-parser'
import type { RawItem } from '../../src/types'
import { cleanText, toIso } from '../text'

const parser = new Parser()

/** Parse RSS 2.0 or Atom XML (GitHub release feeds are Atom). */
export async function parseFeed(xml: string): Promise<RawItem[]> {
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(xml.slice(0, 2000))) {
    // Some sites answer a missing feed with a 200 HTML page; treat that as a failure.
    throw new Error('Response is not an RSS or Atom feed')
  }
  const feed = await parser.parseString(xml)
  return feed.items
    .filter((i) => i.title && i.link)
    .map((i) => ({
      title: cleanText(i.title),
      url: i.link!.trim(),
      publishedAt: toIso(i.isoDate ?? i.pubDate),
      excerpt: cleanText(i.contentSnippet ?? i.summary ?? i.content ?? ''),
    }))
}

/**
 * GitHub release titles are often just a version ("v2.1.30"), so prefix the
 * product name to make the headline readable on its own.
 */
export function labelRelease(item: RawItem, product: string, skipTitlePattern?: string): RawItem | null {
  if (skipTitlePattern && new RegExp(skipTitlePattern, 'i').test(item.title)) return null
  // Only bare versions ("v2.1.30", "1.60.0") get the prefix; named releases already read well.
  const bareVersion = /^v?\d+(\.\d+)*([-+.][\w.]+)?$/i.test(item.title.trim())
  return { ...item, title: bareVersion ? `${product} ${item.title.trim()}` : item.title }
}
