import { useCallback, useEffect, useMemo, useState } from 'react'
import { Feed } from './components/Feed'
import type { ItemActions } from './components/ItemCard'
import { Learn } from './components/Learn'
import { Masthead, type ThemeChoice } from './components/Masthead'
import { ClaudeTimeline, ModelWatch, RunLog } from './components/Rail'
import { Repos } from './components/Repos'
import { Today } from './components/Today'
import { countUnread, EMPTY_FILTER, filterItems, type FilterState } from './lib/filter'
import { ROLE_LABEL } from './lib/roles'
import { getItem, KEYS, setItem, useStoredSet } from './lib/storage'
import { selectToday } from './lib/today'
import type { ItemsFile, ReposFile, Role, SourcesStatusFile } from './types'

type Tab = 'all' | Role | 'repos' | 'learn'
const TABS: { id: Tab; label: string; role: Role | null }[] = [
  { id: 'all', label: 'All', role: null },
  { id: 'claude', label: ROLE_LABEL.claude, role: 'claude' },
  { id: 'se', label: ROLE_LABEL.se, role: 'se' },
  { id: 'pm', label: ROLE_LABEL.pm, role: 'pm' },
  { id: 'qa', label: ROLE_LABEL.qa, role: 'qa' },
  { id: 'repos', label: 'Repos', role: null },
  { id: 'learn', label: 'Learn', role: null },
]

const tabFromHash = (): Tab => {
  const token = window.location.hash.replace(/^#/, '')
  return (TABS.find((t) => t.id === token)?.id ?? 'all') as Tab
}

async function loadJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: 'no-cache' })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

function applyTheme(theme: ThemeChoice) {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
}

export default function App() {
  const [now] = useState(() => new Date())
  const [items, setItems] = useState<ItemsFile | null>(null)
  const [repos, setRepos] = useState<ReposFile | null>(null)
  const [status, setStatus] = useState<SourcesStatusFile | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const saved = getItem(KEYS.theme)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  })
  // Items first seen after the previous visit get the "+" marker for this whole session.
  const [newSince] = useState<string | null>(() => getItem(KEYS.lastVisit))
  const read = useStoredSet(KEYS.read)
  const saved = useStoredSet(KEYS.saved)

  useEffect(() => {
    Promise.all([
      loadJson<ItemsFile>('./data/items.json'),
      loadJson<ReposFile>('./data/repos.json'),
      loadJson<SourcesStatusFile>('./data/sources-status.json'),
    ]).then(([i, r, s]) => {
      setItems(i)
      setRepos(r)
      setStatus(s)
      setLoadError(!i)
    })
    setItem(KEYS.lastVisit, now.toISOString())
  }, [now])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const changeTheme = useCallback((t: ThemeChoice) => {
    setTheme(t)
    applyTheme(t)
    setItem(KEYS.theme, t === 'system' ? null : t)
  }, [])

  const all = useMemo(() => items?.items ?? [], [items])
  const today = useMemo(() => selectToday(all, now), [all, now])
  const current = TABS.find((t) => t.id === tab)!
  const visible = useMemo(() => filterItems(all, current.role, filter, read.set, saved.set), [all, current.role, filter, read.set, saved.set])
  const newCount = useMemo(() => (newSince ? all.filter((i) => i.firstSeenAt > newSince).length : 0), [all, newSince])

  const actions: ItemActions = {
    read: read.set,
    saved: saved.set,
    newSince,
    now,
    onOpen: (id) => read.add([id]),
    onToggleRead: read.toggle,
    onToggleSave: saved.toggle,
  }

  const isFeed = tab !== 'repos' && tab !== 'learn'

  return (
    <>
      <Masthead
        items={items}
        status={status}
        unread={countUnread(all, read.set)}
        newCount={newCount}
        now={now}
        theme={theme}
        onTheme={changeTheme}
      />
      <main>
        {loadError ? (
          <div className="wrap" style={{ paddingBlock: '2rem' }}>
            <p className="empty" data-cy="load-error">
              Today’s feed could not load. Check your connection and reload. If you are running locally, run <code>npm run ingest</code> first.
            </p>
          </div>
        ) : (
          items && <Today view={today} {...actions} />
        )}

        <nav className="sections" aria-label="Sections">
          <div className="wrap">
            <ul className="tabs">
              {TABS.map((t) => {
                const unread = t.role || t.id === 'all' ? countUnread(all, read.set, t.role) : null
                return (
                  <li key={t.id}>
                    <a
                      className="tab"
                      href={`#${t.id}`}
                      aria-current={tab === t.id ? 'page' : undefined}
                      style={t.role ? ({ '--tab-color': `var(--role-${t.role})` } as React.CSSProperties) : undefined}
                      data-cy={`tab-${t.id}`}
                    >
                      {t.label}
                      {unread !== null && (
                        <span className="tab__count" data-cy={`tab-count-${t.id}`} aria-label={`${unread} unread`}>
                          {unread}
                        </span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="wrap page">
          <div style={{ minWidth: 0 }} data-cy={`panel-${tab}`}>
            {tab === 'claude' && <ClaudeTimeline />}
            {isFeed && (
              <Feed
                items={visible}
                total={current.role ? all.filter((i) => i.roles.includes(current.role!)).length : all.length}
                filter={filter}
                setFilter={setFilter}
                onMarkAllRead={read.add}
                label={current.id === 'all' ? 'All items' : current.label}
                {...actions}
              />
            )}
            {tab === 'repos' && <Repos data={repos} now={now} />}
            {tab === 'learn' && <Learn />}
          </div>
          <aside className="rail">
            <ModelWatch />
            <RunLog status={status} now={now} />
          </aside>
        </div>
      </main>
      <footer className="footer">
        <div className="wrap">
          <p>
            Every item links to its original source. This page shows titles, links and one-line summaries only, never article text. Without the
            optional LLM step, a summary is the publisher’s own feed description, shortened.
          </p>
          <p>No analytics, cookies or tracking. Read, saved and learning progress stay in this browser.</p>
        </div>
      </footer>
    </>
  )
}
