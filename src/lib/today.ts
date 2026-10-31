import type { Item, Role } from '../types'
import { ROLE_ORDER, primaryRole } from './roles'

export interface TodayView {
  lead: Item | null
  groups: { role: Role; items: Item[] }[]
  /** "48 hours" normally; "7 days" on a quiet day with fewer than `min` fresh items. */
  windowLabel: string
  count: number
}

/**
 * Pick the 5–8 most important recent items: the best item for each role
 * first (so every lens is represented when it has news), then the rest by
 * score, at most one item per source so a busy release feed cannot fill the
 * page. The top item becomes the lead; the others are grouped by role.
 */
export function selectToday(items: Item[], now: Date, { min = 5, max = 8, perRole = 3 } = {}): TodayView {
  const within = (hours: number) => items.filter((i) => now.getTime() - Date.parse(i.publishedAt) <= hours * 3_600_000)
  let pool = within(48)
  let windowLabel = '48 hours'
  if (pool.length < min) {
    pool = within(24 * 7)
    windowLabel = '7 days'
  }
  const ranked = [...pool].sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))

  const picked: Item[] = []
  const usedSources = new Set<string>()
  const take = (item: Item) => {
    picked.push(item)
    usedSources.add(item.sourceId)
  }
  for (const role of ROLE_ORDER) {
    const best = ranked.find((i) => primaryRole(i.roles) === role && !usedSources.has(i.sourceId) && !picked.includes(i))
    if (best && picked.length < max) take(best)
  }
  // At most `perRole` per role, so one busy lens (usually Claude) cannot take the whole page.
  const roleCount = (role: Role) => picked.filter((i) => primaryRole(i.roles) === role).length
  for (const item of ranked) {
    if (picked.length >= max) break
    if (!picked.includes(item) && !usedSources.has(item.sourceId) && roleCount(primaryRole(item.roles)) < perRole) take(item)
  }
  // Other roles had nothing more: lift the role cap, keep one item per source.
  for (const item of ranked) {
    if (picked.length >= max) break
    if (!picked.includes(item) && !usedSources.has(item.sourceId)) take(item)
  }
  // Still short (few sources today)? Allow a second item per source.
  for (const item of ranked) {
    if (picked.length >= Math.min(min, ranked.length)) break
    if (!picked.includes(item)) take(item)
  }

  picked.sort((a, b) => b.score - a.score)
  const [lead = null, ...rest] = picked
  const groups = ROLE_ORDER.map((role) => ({ role, items: rest.filter((i) => primaryRole(i.roles) === role) })).filter(
    (g) => g.items.length,
  )
  return { lead, groups, windowLabel, count: picked.length }
}
