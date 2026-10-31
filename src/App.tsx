import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppBar, type TabDef } from './components/AppBar'
import { BackToTop } from './components/BackToTop'
import { CodeIcon, GitHubIcon, LinkedInIcon } from './components/Icons'
import { AUTHOR_LINKS, AUTHOR_NAME } from './content/author'
import { FacetToggle } from './components/FacetToggle'
import { Feed } from './components/Feed'
import type { ItemActions } from './components/ItemCard'
import { Learn } from './components/Learn'
import { Masthead, type ThemeChoice } from './components/Masthead'
import { NextRefresh } from './components/NextRefresh'
import { ClaudeTimeline, ModelWatch, RunLog } from './components/Rail'
import { Repos } from './components/Repos'
import { Saved } from './components/Saved'
import { Toast, type ToastMessage } from './components/Toast'
import { Today } from './components/Today'
import { countUnread, EMPTY_FILTER, filterItems, type FilterState } from './lib/filter'
import { ROLE_LABEL } from './lib/roles'
import { toSavedRepo, type SavedItem, type SavedRepo, type SavedStep } from './lib/saved'
import { getItem, KEYS, setItem, useStoredRecords, useStoredSet } from './lib/storage'
import { selectToday } from './lib/today'
import type { Area, ItemsFile, ReposFile, Role, SourcesStatusFile } from './types'

type Tab = 'all' | Role | 'saved' | 'repos' | 'learn'
const TABS: { id: Tab; label: string; role: Role | null; placeholder: string }[] = [
  { id: 'all', label: 'All', role: null, placeholder: 'Search all news…' },
  { id: 'claude', label: ROLE_LABEL.claude, role: 'claude', placeholder: 'Search Claude news and releases…' },
  { id: 'fs', label: ROLE_LABEL.fs, role: 'fs', placeholder: 'Search full-stack news…' },
  { id: 'se', label: ROLE_LABEL.se, role: 'se', placeholder: 'Search AI dev tools news…' },
  { id: 'pm', label: ROLE_LABEL.pm, role: 'pm', placeholder: 'Search PM news…' },
  { id: 'qa', label: ROLE_LABEL.qa, role: 'qa', placeholder: 'Search QA news…' },
  { id: 'saved', label: 'Saved', role: null, placeholder: 'Search saved…' },
  { id: 'repos', label: 'Repos', role: null, placeholder: 'Search repos…' },
  { id: 'learn', label: 'Learn', role: null, placeholder: 'Search learning steps…' },
]

/** Sub-filters inside a role tab, matched against an item's `areas`. */
const FACETS: Partial<Record<Role, { label: string; options: { id: Area; label: string }[] }>> = {
  qa: {
    label: 'QA area',
    options: [
      { id: 'manual', label: 'Manual & exploratory' },
      { id: 'automation', label: 'Automation' },
      { id: 'ai-testing', label: 'Testing AI' },
    ],
  },
  fs: {
    label: 'Full-stack area',
    options: [
      { id: 'frontend', label: 'Frontend' },
      { id: 'backend', label: 'Backend' },
    ],
  },
}

/** The tab in the URL hash; with no hash, the tab open last time (or All). */
const tabFromHash = (): Tab => {
  const token = window.location.hash.replace(/^#/, '') || getItem(KEYS.lastTab)
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
  // Each role tab remembers its own facet (QA: Manual / Automation / Testing AI…).
  const [facetByTab, setFacetByTab] = useState<Partial<Record<Tab, Area | 'all'>>>({})
  const facet = facetByTab[tab] ?? 'all'
  const setFacet = (value: Area | 'all') => setFacetByTab((m) => ({ ...m, [tab]: value }))
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const saved = getItem(KEYS.theme)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  })
  // Items first seen after the previous visit get the "+" marker for this whole session.
  const [newSince] = useState<string | null>(() => getItem(KEYS.lastVisit))
  const read = useStoredSet(KEYS.read)
  const savedItems = useStoredRecords<SavedItem>(KEYS.savedItems)
  const savedRepos = useStoredRecords<SavedRepo>(KEYS.savedRepos)
  const savedSteps = useStoredRecords<SavedStep>(KEYS.savedSteps)
  const savedTotal = savedItems.ids.size + savedRepos.ids.size + savedSteps.ids.size
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const notifySaved = useCallback((nowSaved: boolean) => {
    setToast({ id: Date.now(), text: nowSaved ? 'Saved' : 'Removed from Saved', view: nowSaved })
  }, [])

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

  // One-time move from the old saved format (ids only) to snapshots that outlive the 30-day feed.
  const { addMany: addSavedItems } = savedItems
  useEffect(() => {
    if (!items) return
    const legacy = getItem(KEYS.saved)
    if (!legacy) return
    try {
      const ids = new Set<string>(JSON.parse(legacy))
      addSavedItems(items.items.filter((i) => ids.has(i.id)).map((i) => [i.id, i] as [string, SavedItem]))
    } catch {
      // Unreadable old data: nothing to migrate.
    }
    setItem(KEYS.saved, null)
  }, [items, addSavedItems])

  useEffect(() => setItem(KEYS.lastTab, tab), [tab])

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
  const facetDef = current.role ? FACETS[current.role] : undefined
  const roleItems = useMemo(
    () => filterItems(all, current.role, feedFilter, read.set, savedItems.ids),
    [all, current.role, feedFilter, read.set, savedItems.ids],
  )
  const visible = useMemo(
    () => (facetDef && facet !== 'all' ? roleItems.filter((i) => i.areas?.includes(facet)) : roleItems),
    [roleItems, facetDef, facet],
  )
  const facets = facetDef && (
    <FacetToggle
      label={facetDef.label}
      options={[
        { id: 'all', label: 'All', count: roleItems.length },
        ...facetDef.options.map((o) => ({ ...o, count: roleItems.filter((i) => i.areas?.includes(o.id)).length })),
      ]}
      value={facet}
      onChange={setFacet}
    />
  )
  const newCount = useMemo(() => (newSince ? all.filter((i) => i.firstSeenAt > newSince).length : 0), [all, newSince])

  const actions: ItemActions = {
    read: read.set,
    saved: savedItems.ids,
    newSince,
    now,
    highlight: query,
    showWhy: items?.llmEnabled ?? false,
    onOpen: (id) => read.add([id]),
    onToggleRead: read.toggle,
    onToggleSave: (item) => notifySaved(savedItems.toggle(item.id, item)),
  }

  const tabs: TabDef[] = TABS.map((t) =>
    t.id === 'saved'
      ? { id: t.id, label: t.label, icon: <span className="tab__star" aria-hidden="true">★</span>, count: savedTotal, countLabel: `${savedTotal} saved` }
      : {
          id: t.id,
          label: t.label,
          color: t.role ?? undefined,
          count: t.role || t.id === 'all' ? countUnread(all, read.set, t.role) : null,
        },
  )

  const isFeed = tab !== 'repos' && tab !== 'learn' && tab !== 'saved'
  const showToday = tab === 'all' && !query && !loadError && items

  return (
    <>
      <Masthead
        items={items}
        status={status}
        unread={countUnread(all, read.set)}
        newCount={newCount}
        savedCount={savedTotal}
        now={now}
        theme={theme}
        onTheme={changeTheme}
        runExtra={items && <NextRefresh generatedAt={items.generatedAt} />}
        byline={
          <p className="byline">
            by{' '}
            <a href={AUTHOR_LINKS.github} target="_blank" rel="noopener noreferrer">
              {AUTHOR_NAME}
            </a>
          </p>
        }
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
                facets={facets}
                {...actions}
              />
            )}
            {tab === 'saved' && (
              <Saved
                items={savedItems.list}
                repos={savedRepos.list}
                steps={savedSteps.list}
                query={query}
                onUnsaveRepo={savedRepos.remove}
                onUnsaveStep={savedSteps.remove}
                onClearAll={() => {
                  savedItems.clear()
                  savedRepos.clear()
                  savedSteps.clear()
                  setToast({ id: Date.now(), text: 'Cleared all saved' })
                }}
                onCopied={(n) => setToast({ id: Date.now(), text: `Copied ${n} links` })}
                {...actions}
              />
            )}
            {tab === 'repos' && (
              <Repos
                data={repos}
                now={now}
                query={query}
                savedIds={savedRepos.ids}
                onToggleSave={(r) => notifySaved(savedRepos.toggle(r.fullName, toSavedRepo(r)))}
              />
            )}
            {tab === 'learn' && (
              <Learn
                query={query}
                savedIds={savedSteps.ids}
                onToggleSave={(s, track) =>
                  notifySaved(savedSteps.toggle(s.id, { title: s.title, url: s.url, source: s.source, why: s.why, track }))
                }
              />
            )}
          </div>
          <aside className="rail">
            <ModelWatch />
            <RunLog status={status} now={now} />
          </aside>
        </div>
      </main>
      <BackToTop focusTarget={searchRef} />
      <Toast toast={toast} onDone={clearToast} />
      <footer className="footer">
        <div className="wrap">
          <div className="credit" data-cy="author-credit">
            <p className="credit__name">
              Designed &amp; built by <strong>{AUTHOR_NAME}</strong>
            </p>
            <ul className="credit__links">
              <li>
                <a href={AUTHOR_LINKS.github} target="_blank" rel="noopener noreferrer">
                  <GitHubIcon /> GitHub
                </a>
              </li>
              <li>
                <a href={AUTHOR_LINKS.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedInIcon /> LinkedIn
                </a>
              </li>
              <li>
                <a href={AUTHOR_LINKS.repo} target="_blank" rel="noopener noreferrer">
                  <CodeIcon /> View source
                </a>
              </li>
            </ul>
          </div>
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
