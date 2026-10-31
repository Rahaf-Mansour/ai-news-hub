import type { RawItem, SourceConfig } from '../../src/types'
import type { TextFetcher } from '../http'
import { parseAnthropicCards, parseReleaseNotes } from './anthropic'
import { buildHnUrl, parseHn } from './hn'
import { labelRelease, parseFeed } from './rss'

/** Fetch one source and return its newest raw items. Throws on any failure; the runner isolates it. */
export async function fetchSource(source: SourceConfig, fetchText: TextFetcher, now: Date): Promise<RawItem[]> {
  let items: RawItem[]

  switch (source.kind) {
    case 'rss':
      items = await parseFeed(await fetchText(source.feedUrl))
      break
    case 'github-releases': {
      const product = source.name.replace(/ releases$/i, '')
      items = (await parseFeed(await fetchText(source.feedUrl)))
        .map((i) => labelRelease(i, product, source.skipTitlePattern))
        .filter((i): i is RawItem => i !== null)
      break
    }
    case 'anthropic-cards':
      items = parseAnthropicCards(await fetchText(source.feedUrl), source.feedUrl, source.hrefPattern ?? '.')
      break
    case 'claude-release-notes':
      items = parseReleaseNotes(await fetchText(source.feedUrl), source.feedUrl)
      break
    case 'hn': {
      if (!source.hn) throw new Error(`Source ${source.id} is kind "hn" but has no hn config`)
      items = parseHn(await fetchText(buildHnUrl(source.feedUrl, source.hn.query, source.hn.minPoints, now)))
      break
    }
    default:
      throw new Error(`Unknown source kind: ${(source as SourceConfig).kind}`)
  }

  if (!items.length) throw new Error('Fetched OK but parsed 0 items (markup or feed format may have changed)')

  return items
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, source.maxItems ?? 15)
}
