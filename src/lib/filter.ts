import type { Item, Role, SourceType, TrustTier } from '../types'

export type ShowFilter = 'all' | 'unread' | 'saved'

export interface FilterState {
  query: string
  tiers: TrustTier[]
  types: SourceType[]
  show: ShowFilter
}

export const EMPTY_FILTER: FilterState = { query: '', tiers: [], types: [], show: 'all' }

/** Every word of the query must appear in the title, summary, source or "why" line. */
export function matchesQuery(item: Item, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = `${item.title} ${item.summary} ${item.sourceName} ${item.whyItMatters ?? ''}`.toLowerCase()
  return words.every((w) => haystack.includes(w))
}

export function filterItems(
  items: Item[],
  role: Role | null,
  filter: FilterState,
  read: ReadonlySet<string>,
  saved: ReadonlySet<string>,
): Item[] {
  return items.filter(
    (i) =>
      (!role || i.roles.includes(role)) &&
      (!filter.tiers.length || filter.tiers.includes(i.tier)) &&
      (!filter.types.length || filter.types.includes(i.type)) &&
      (filter.show !== 'unread' || !read.has(i.id)) &&
      (filter.show !== 'saved' || saved.has(i.id)) &&
      matchesQuery(i, filter.query),
  )
}

export function countUnread(items: Item[], read: ReadonlySet<string>, role: Role | null = null): number {
  return items.filter((i) => (!role || i.roles.includes(role)) && !read.has(i.id)).length
}
