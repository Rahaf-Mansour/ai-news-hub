import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { RawItem } from '../../src/types'
import { DATE_PATTERN, cleanText, firstSentence, parseMonthDayYear } from '../text'

/**
 * anthropic.com/news and /engineering have no RSS feed. Both pages are
 * server-rendered lists of cards: a link with a heading inside, and a date
 * in the same card container. We find links whose path matches
 * `hrefPattern`, then walk up at most three parents to find the card's date.
 */
export function parseAnthropicCards(html: string, baseUrl: string, hrefPattern: string): RawItem[] {
  const $ = cheerio.load(html)
  const allowed = new RegExp(hrefPattern)
  const seen = new Map<string, RawItem>()

  const hrefOf = (el: AnyNode) => ($(el).attr('href') ?? '').split('#')[0]
  // A card link wraps its headline (<a><h3>…</h3></a>); a list link sits inside one (<h3><a>…</a></h3>).
  const titleOf = (el: AnyNode) =>
    cleanText($(el).find('h1,h2,h3,h4').first().text()) ||
    cleanText($(el).find('img[alt]').attr('alt')) ||
    ($(el).parent().is('h1,h2,h3,h4') ? cleanText($(el).text()) : '')
  // Article links carry a headline (or a titled image); category links like /news/product do not.
  const isArticleLink = (el: AnyNode) => allowed.test(hrefOf(el)) && titleOf(el).length >= 6

  $('a[href]').each((_, a) => {
    if (!isArticleLink(a)) return
    const href = hrefOf(a)
    const url = new URL(href, baseUrl).toString()
    const link = $(a)
    const title = titleOf(a)

    let container = link.parent()
    let publishedAt: string | null = null
    for (let depth = 0; depth < 4 && container.length; depth++) {
      // Once the container holds a second article, we have left the card: stop
      // rather than borrow a neighbour's date.
      const articles = new Set(container.find('a[href]').toArray().filter(isArticleLink).map(hrefOf))
      if (articles.size > 1) break
      const text = cleanText(container.text())
      if (DATE_PATTERN.test(text)) {
        publishedAt = parseMonthDayYear(text)
        break
      }
      container = container.parent()
    }

    const excerpt = cleanText(link.find('p').first().text()) || cleanText(container.find('p').first().text())
    const existing = seen.get(url)
    // The same article can appear in a hero, a grid and a list; keep the richest copy.
    if (!existing || (!existing.publishedAt && publishedAt) || (!existing.excerpt && excerpt)) {
      seen.set(url, {
        title: existing?.title && existing.title.length > title.length ? existing.title : title,
        url,
        publishedAt: publishedAt ?? existing?.publishedAt ?? null,
        excerpt: excerpt || existing?.excerpt,
      })
    }
  })

  return [...seen.values()].filter((i) => i.publishedAt)
}

/**
 * The Claude Platform release notes page has one <h3 id="october-7-2026"> per
 * day, followed by a <ul> of changes. We emit one item per day: the first
 * change is the headline, the next two make the excerpt.
 */
export function parseReleaseNotes(html: string, pageUrl: string): RawItem[] {
  const $ = cheerio.load(html)
  const items: RawItem[] = []

  $('h2,h3').each((_, h) => {
    const heading = $(h)
    const publishedAt = parseMonthDayYear(heading.text())
    // Only headings that are just a date (the live page adds invisible button text).
    const rest = heading.text().replace(DATE_PATTERN, '').replace(/[^\p{L}\p{N}]/gu, '')
    if (!publishedAt || rest) return

    const entries = heading
      .nextUntil(h.tagName)
      .filter('ul,ol')
      .first()
      .children('li')
      .toArray()
      .map((li) => cleanText($(li).text()))
      .filter(Boolean)
    if (!entries.length) return

    // Lead with the most important change of the day (a model launch beats a price tweak).
    const ranked = entries
      .map((text, index) => ({ text, index, weight: entryWeight(text) }))
      .sort((a, b) => b.weight - a.weight || a.index - b.index)
      .map((e) => e.text)

    const id = heading.attr('id')
    const more = ranked.length > 3 ? ` (+${ranked.length - 3} more)` : ''
    items.push({
      title: firstSentence(ranked[0], 150),
      url: id ? `${pageUrl}#${id}` : pageUrl,
      publishedAt,
      excerpt: ranked.slice(1, 3).map((e) => firstSentence(e, 140)).join(' ') + more,
    })
  })

  return items
}

function entryWeight(text: string): number {
  let w = 0
  if (/\b(launched|introduc\w*|now available|generally available|public beta)\b/i.test(text)) w += 3
  if (/\bClaude (Opus|Sonnet|Haiku|Fable|Mythos) \d/.test(text)) w += 2
  if (/\b(deprecat\w*|retir\w*|breaking)\b/i.test(text)) w += 1
  return w
}
