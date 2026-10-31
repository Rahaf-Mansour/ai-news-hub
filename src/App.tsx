import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppBar, type TabDef } from './components/AppBar'
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
const TABS: { id: Tab; label: string; role: Role | null; placeholder: string }[] = [
  { id: 'all', label: 'All', role: null, placeholder: 'Search all news…' },
  { id: 'claude', label: ROLE_LABEL.claude, role: 'claude', placeholder: 'Search Claude news and releases…' },
  { id: 'se', label: ROLE_LABEL.se, role: 'se', placeholder: 'Search SE news…' },
  { id: 'pm', label: ROLE_LABEL.pm, role: 'pm', placeholder: 'Search PM news…' },
  { id: 'qa', label: ROLE_LABEL.qa, role: 'qa', placeholder: 'Search QA news…' },
  { id: 'repos', label: 'Repos', role: null, placeholder: 'Search repos…' },
  { id: 'learn', label: 'Learn', role: null, placeholder: 'Search learning steps…' },
]

const tabFromHash = (): Tab => {
  const token = window.location.hash.replace(/^#/, '')
  return (TABS.find((t) => t.id === token)?.id ?? 'all') as Tab
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

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
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const saved = getItem(KEYS.theme)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  })
  // Items first seen after the previous visit get the "+" marker for this whole session.
  const [newSince] = useState<string | null>(() => getItem(KEYS.lastVisit))
  const read = useStoredSet(KEYS.read)
  const saved = useStoredSet(KEYS.saved)

  const searchRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollOnTabChange = useRef(false)

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

  // Expose the sticky bar's height so content can stop just below it (scroll-margin-top).
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const update = () => document.documentElement.style.setProperty('--appbar-h', `${bar.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  // After a tab click, bring the section's start to just below the sticky bar.
  useEffect(() => {
    if (!scrollOnTabChange.current) return
    scrollOnTabChange.current = false
    contentRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [tab])

  // "/" focuses search from anywhere (except while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const changeTheme = useCallback((t: ThemeChoice) => {
    setTheme(t)
    applyTheme(t)
    setItem(KEYS.theme, t === 'system' ? null : t)
  }, [])

  const all = useMemo(() => items?.items ?? [], [items])
  const today = useMemo(() => selectToday(all, now), [all, now])
  const current = TABS.find((t) => t.id === tab)!
  const feedFilter = useMemo(() => ({ ...filter, query }), [filter, query])
  const visible = useMemo(() => filterItems(all, current.role, feedFilter, read.set, saved.set), [all, current.role, feedFilter, read.set, saved.set])
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

  const tabs: TabDef[] = TABS.map((t) => ({
    id: t.id,
    label: t.label,
    color: t.role ?? undefined,
    count: t.role || t.id === 'all' ? countUnread(all, read.set, t.role) : null,
  }))

  const isFeed = tab !== 'repos' && tab !== 'learn'
  const showToday = tab === 'all' && !query && !loadError && items

  return (
    <>
      <Masthead
        items={items}
        status={status}
        unread={countUnread(all, read.set)}
        newCount={newCount}
        savedCount={saved.set.size}
        now={now}
        theme={theme}
        onTheme={changeTheme}
      />
      <AppBar
        tabs={tabs}
        current={tab}
        query={query}
        onQuery={setQuery}
        placeholder={current.placeholder}
        inputRef={searchRef}
        barRef={barRef}
        onTabClick={() => (scrollOnTabChange.current = true)}
      />
      <main>
        {loadError && (
          <div className="wrap" style={{ paddingBlock: '2rem' }}>
            <p className="empty" data-cy="load-error">
              Today’s feed could not load. Check your connection and reload. If you are running locally, run <code>npm run ingest</code> first.
            </p>
          </div>
        )}
        {showToday && <Today view={today} {...actions} />}

        <div className="wrap page" ref={contentRef} id="content">
          <div style={{ minWidth: 0 }} data-cy={`panel-${tab}`}>
            {tab === 'claude' && <ClaudeTimeline query={query} />}
            {isFeed && (
              <Feed
                items={visible}
                total={current.role ? all.filter((i) => i.roles.includes(current.role!)).length : all.length}
                filter={feedFilter}
                setFilter={(f) => setFilter({ ...f, query: '' })}
                onMarkAllRead={read.add}
                label={current.id === 'all' ? 'All items' : current.label}
                {...actions}
              />
            )}
            {tab === 'repos' && <Repos data={repos} now={now} query={query} />}
            {tab === 'learn' && <Learn query={query} />}
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
