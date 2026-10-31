import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Item } from '../src/types'

/** One JSON file per month of publication: data/archive/2026-10.json. Scores are not stored (they depend on "now"). */
export function loadArchive(dir: string): Item[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
  } catch {
    return []
  }
  return files.flatMap((f) => {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { items: Omit<Item, 'score'>[] }
    return data.items.map((i) => ({ ...i, score: 0 }))
  })
}

export function writeArchive(dir: string, items: Item[]): string[] {
  mkdirSync(dir, { recursive: true })
  const byMonth = new Map<string, Omit<Item, 'score'>[]>()
  for (const { score: _score, ...rest } of items) {
    const month = rest.publishedAt.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month)!.push(rest)
  }
  const written: string[] = []
  for (const [month, monthItems] of byMonth) {
    monthItems.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))
    writeJson(join(dir, `${month}.json`), { month, count: monthItems.length, items: monthItems })
    written.push(month)
  }
  return written.sort()
}

export function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return null
  }
}

export function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}
