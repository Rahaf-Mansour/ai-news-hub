import { useCallback, useMemo, useState } from 'react'

// Everything here lives only in this browser. Reads and writes are wrapped
// because storage can be blocked (private windows, cleared site data).

export const KEYS = {
  read: 'hub:read',
  /** Old format: an array of saved item ids. Migrated into savedItems on load. */
  saved: 'hub:saved',
  savedItems: 'hub:savedItems',
  savedRepos: 'hub:savedRepos',
  savedSteps: 'hub:savedSteps',
  theme: 'hub:theme',
  lastVisit: 'hub:lastVisit',
  learn: 'hub:learn',
} as const

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setItem(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the page still works, the state just won't persist.
  }
}

function loadSet(key: string): Set<string> {
  try {
    const parsed = JSON.parse(getItem(key) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/** A Set of ids persisted in localStorage, with toggle/add helpers. */
export function useStoredSet(key: string) {
  const [set, setSet] = useState<Set<string>>(() => loadSet(key))
  const update = useCallback(
    (fn: (next: Set<string>) => void) => {
      setSet((prev) => {
        const next = new Set(prev)
        fn(next)
        setItem(key, JSON.stringify([...next]))
        return next
      })
    },
    [key],
  )
  const toggle = useCallback((id: string) => update((s) => (s.has(id) ? s.delete(id) : s.add(id))), [update])
  const add = useCallback((ids: string[]) => update((s) => ids.forEach((id) => s.add(id))), [update])
  const remove = useCallback((id: string) => update((s) => s.delete(id)), [update])
  return { set, toggle, add, remove }
}

export interface SavedEntry<T> {
  savedAt: string
  data: T
}
export type SavedMap<T> = Record<string, SavedEntry<T>>

export function loadRecords<T>(key: string): SavedMap<T> {
  try {
    const parsed = JSON.parse(getItem(key) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as SavedMap<T>) : {}
  } catch {
    return {}
  }
}

/** Newest saved first. */
export function savedList<T>(map: SavedMap<T>): (SavedEntry<T> & { id: string })[] {
  return Object.entries(map)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

/**
 * Saved things keyed by id, each with a snapshot of what was saved, so a
 * bookmark still shows after the item leaves the 30-day feed window.
 */
export function useStoredRecords<T>(key: string) {
  const [map, setMap] = useState<SavedMap<T>>(() => loadRecords<T>(key))
  const write = useCallback(
    (fn: (next: SavedMap<T>) => void) => {
      setMap((prev) => {
        const next = { ...prev }
        fn(next)
        setItem(key, Object.keys(next).length ? JSON.stringify(next) : null)
        return next
      })
    },
    [key],
  )
  const ids = useMemo(() => new Set(Object.keys(map)), [map])
  const list = useMemo(() => savedList(map), [map])
  /** Saves or unsaves; returns true when the thing is now saved. */
  const toggle = useCallback(
    (id: string, data: T): boolean => {
      const nowSaved = !(id in map)
      write((m) => {
        if (nowSaved) m[id] = { savedAt: new Date().toISOString(), data }
        else delete m[id]
      })
      return nowSaved
    },
    [map, write],
  )
  const remove = useCallback((id: string) => write((m) => void delete m[id]), [write])
  const clear = useCallback(() => write((m) => Object.keys(m).forEach((k) => delete m[k])), [write])
  const addMany = useCallback(
    (entries: [string, T][]) =>
      write((m) => {
        const at = new Date().toISOString()
        for (const [id, data] of entries) if (!(id in m)) m[id] = { savedAt: at, data }
      }),
    [write],
  )
  return { map, ids, list, toggle, remove, clear, addMany }
}
