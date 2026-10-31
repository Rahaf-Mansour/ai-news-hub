const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

// No leading \b: rendered card text often runs words together ("AnnouncementsOct 7, 2026").
export const DATE_PATTERN =
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) (\d{1,2}), (20\d\d)(?!\d)/

/**
 * Parse "Oct 7, 2026" or "October 7, 2026" to an ISO string at 12:00 UTC.
 * Noon keeps the calendar day stable in every reader's time zone.
 */
export function parseMonthDayYear(text: string): string | null {
  const m = DATE_PATTERN.exec(text)
  if (!m) return null
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()]
  const day = Number(m[2])
  const year = Number(m[3])
  if (month === undefined || day < 1 || day > 31) return null
  return new Date(Date.UTC(year, month, day, 12)).toISOString()
}

/** Any date string → ISO, or null if it does not parse. */
export function toIso(value: string | undefined | null): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Collapse whitespace and strip any leftover tags from feed text. */
export function cleanText(value: string | undefined | null): string {
  if (!value) return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Drop emoji (and the spaces around them) at the start of a feed summary: "🎉 Claude Code…" → "Claude Code…". */
export function stripLeadingEmoji(value: string): string {
  return value.replace(/^(?:[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\s]|\u200d|\ufe0f)+/u, '')
}

/** Many feeds open the summary with the title again; drop that repeat ("Octoverse 2026 I'm at…" → "I'm at…"). */
export function stripTitlePrefix(summary: string, title: string): string {
  const t = title.trim().toLowerCase()
  if (t.length < 8 || !summary.toLowerCase().startsWith(t)) return summary
  return summary.slice(t.length).replace(/^[\s\-–—:|.,]+/, '')
}

/** Cut at a word boundary and add an ellipsis. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}

/** First sentence of a block of text, capped at `max` characters. */
export function firstSentence(value: string, max = 140): string {
  const text = cleanText(value)
  const m = /^(.+?[.!?])(\s|$)/.exec(text)
  return truncate(m ? m[1] : text, max)
}
