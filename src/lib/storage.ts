import { useCallback, useState } from 'react'

// Everything here lives only in this browser. Reads and writes are wrapped
// because storage can be blocked (private windows, cleared site data).

export const KEYS = {
  read: 'hub:read',
  saved: 'hub:saved',
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
