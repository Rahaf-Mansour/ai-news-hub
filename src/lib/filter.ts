import type { LearnStep } from '../content/learn'
import type { Item, Repo, Role, SourceType, TrustTier } from '../types'
import { ROLE_LABEL } from './roles'

export interface FilterState {
  query: string
  tiers: TrustTier[]
  types: SourceType[]
  hideRead: boolean
  savedOnly: boolean
}

export const EMPTY_FILTER: FilterState = { query: '', tiers: [], types: [], hideRead: false, savedOnly: false }

export function queryWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

/** The search rule used everywhere: every word of the query must appear somewhere in the given fields. */
export function matchesWords(fields: (string | undefined | null)[], query: string): boolean {
  const words = queryWords(query)
  if (!words.length) return true
  const haystack = fields.filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => haystack.includes(w))
}

/** Feed items: title, summary, source or "why" line. */
export function matchesQuery(item: Item, query: string): boolean {
  return matchesWords([item.title, item.summary, item.sourceName, item.whyItMatters], query)
}

/** Repos: name, "why" line, note, license and role labels. */
export function matchesRepo(repo: Repo, query: string): boolean {
  return matchesWords([repo.fullName, repo.why, repo.note, repo.license, ...repo.roles.map((r) => ROLE_LABEL[r])], query)
}

/** Learning steps: title, source, "why" line, and the name of the track they belong to. */
export function matchesStep(step: LearnStep, trackName: string, query: string): boolean {
  return matchesWords([step.title, step.source, step.why, trackName], query)
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
      (!filter.hideRead || !read.has(i.id)) &&
      (!filter.savedOnly || saved.has(i.id)) &&
      matchesQuery(i, filter.query),
  )
}

export function countUnread(items: Item[], read: ReadonlySet<string>, role: Role | null = null): number {
  return items.filter((i) => (!role || i.roles.includes(role)) && !read.has(i.id)).length
}
