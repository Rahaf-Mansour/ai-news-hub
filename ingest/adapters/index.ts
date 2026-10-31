import type { RawItem, SourceConfig } from '../../src/types'
import type { TextFetcher } from '../http'
import { parseAnthropicCards, parseReleaseNotes } from './anthropic'
import { buildHnUrl, parseHn } from './hn'
import { labelRelease, parseFeed } from './rss'

/** Always skipped in release feeds: alpha/beta/rc/dev/nightly builds ("4.4.0a0.dev1662", "v1.61.0-beta"). */
const PRERELEASE = String.raw`(alpha|beta|canary|nightly|next|\brc\d*\b|\.dev\d*|\d(a|b|rc)\d)`

/** A source's own skip pattern adds to the pre-release rule rather than replacing it. */
export const releaseSkipPattern = (custom?: string) => (custom ? `${PRERELEASE}|(${custom})` : PRERELEASE)

/** Fetch one source and return its newest raw items. Throws on any failure; the runner isolates it. */
export async function fetchSource(source: SourceConfig, fetchText: TextFetcher, now: Date): Promise<RawItem[]> {
  let parsed: RawItem[]

  switch (source.kind) {
    case 'rss':
    case 'github-releases':
      parsed = await parseFeed(await fetchText(source.feedUrl))
      break
    case 'anthropic-cards':
      parsed = parseAnthropicCards(await fetchText(source.feedUrl), source.feedUrl, source.hrefPattern ?? '.')
      break
    case 'claude-release-notes':
      parsed = parseReleaseNotes(await fetchText(source.feedUrl), source.feedUrl)
      break
    case 'hn': {
      if (!source.hn) throw new Error(`Source ${source.id} is kind "hn" but has no hn config`)
      parsed = parseHn(await fetchText(buildHnUrl(source.feedUrl, source.hn.query, source.hn.minPoints, now)))
      break
    }
    default:
      throw new Error(`Unknown source kind: ${(source as SourceConfig).kind}`)
  }

  // Checked before filtering: a release feed whose newest entries are all canaries is healthy, just quiet.
  if (!parsed.length && source.kind !== 'hn') {
    throw new Error('Fetched OK but parsed 0 items (markup or feed format may have changed)')
  }
  let items = parsed
  if (source.kind === 'github-releases') {
    const product = source.name.replace(/ releases$/i, '')
    items = items
      .map((i) => labelRelease(i, product, releaseSkipPattern(source.skipTitlePattern)))
      .filter((i): i is RawItem => i !== null)
  }
  if (source.linkFilter) {
    const links = new RegExp(source.linkFilter)
    items = items.filter((i) => links.test(i.url))
  }
  if (source.titleFilter) {
    const filter = new RegExp(source.titleFilter, 'i')
    items = items.filter((i) => filter.test(i.title))
  }

  return items
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, source.maxItems ?? 15)
}
