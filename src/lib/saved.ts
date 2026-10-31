import type { Item, Repo } from '../types'

/** A saved item keeps the full item, so it still shows after leaving the 30-day feed. */
export type SavedItem = Item
/** What is stored for a saved repo: enough to show it even if repos.json changes. */
export type SavedRepo = Pick<Repo, 'fullName' | 'url' | 'why' | 'roles'> & Partial<Pick<Repo, 'note' | 'license'>>
/** What is stored for a saved learning step. */
export interface SavedStep {
  title: string
  url: string
  source: string
  why: string
  track: string
}

export const toSavedRepo = (r: Repo): SavedRepo => ({ fullName: r.fullName, url: r.url, why: r.why, roles: r.roles, note: r.note, license: r.license })

/** A Markdown list of everything saved, for the "Copy links" button. */
export function savedMarkdown(items: SavedItem[], repos: SavedRepo[], steps: SavedStep[]): string {
  const md = (text: string) => text.replace(/([[\]])/g, '\\$1')
  const sections: string[] = []
  if (items.length) sections.push(['### Articles & news', ...items.map((i) => `- [${md(i.title)}](${i.url}) — ${i.sourceName}`)].join('\n'))
  if (repos.length) sections.push(['### Repos', ...repos.map((r) => `- [${r.fullName}](${r.url}) — ${r.why}`)].join('\n'))
  if (steps.length) sections.push(['### Learning steps', ...steps.map((s) => `- [${md(s.title)}](${s.url}) — ${s.source}`)].join('\n'))
  return sections.length ? `## Saved from AI News & Learning Hub\n\n${sections.join('\n\n')}\n` : ''
}
