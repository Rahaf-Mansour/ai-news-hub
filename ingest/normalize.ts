import { createHash } from 'node:crypto'

const TRACKING_PARAMS = /^(utm_\w+|ref|ref_src|ref_url|source|fbclid|gclid|mc_cid|mc_eid|s|r|publication_id|post_id|isFreemail|triedRedirect)$/i

/**
 * Canonical form used for dedupe and IDs: https, lower-case host without
 * "www.", tracking params removed, remaining params sorted, no trailing slash.
 * The fragment is kept only when `keepHash` is set (the release notes link to
 * a day anchor, and each day is a separate item).
 */
export function canonicalUrl(input: string, keepHash = false): string {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return input.trim()
  }
  url.protocol = 'https:'
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.test(key))
    .sort(([a], [b]) => a.localeCompare(b))
  url.search = new URLSearchParams(params).toString()
  if (!keepHash) url.hash = ''
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1)
  return url.toString()
}

export function itemId(canonical: string): string {
  return createHash('sha1').update(canonical).digest('hex').slice(0, 12)
}

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'how', 'we', 'our', 'your', 'show', 'hn', 'ask'])

/** Word tokens for title similarity. Version numbers like "v2.1.30" stay one token. */
export function titleTokens(title: string): Set<string> {
  const tokens = title.toLowerCase().match(/[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)*/gu) ?? []
  return new Set(tokens.filter((t) => !STOPWORDS.has(t)))
}

export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a)
  const tb = titleTokens(b)
  if (!ta.size || !tb.size) return 0
  let shared = 0
  for (const t of ta) if (tb.has(t)) shared++
  return shared / (ta.size + tb.size - shared)
}
