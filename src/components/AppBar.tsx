import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ChevronRightIcon } from './Icons'

export interface TabDef {
  id: string
  label: string
  /** Role colour token name, e.g. "claude" → var(--role-claude). */
  color?: string
  icon?: ReactNode
  count?: number | null
  countLabel?: string
  /** "library" tabs (Saved, Repos, Learn) sit after a divider, apart from the news lenses. */
  group?: 'library'
}

interface Props {
  tabs: TabDef[]
  current: string
  query: string
  onQuery: (q: string) => void
  placeholder: string
  inputRef: RefObject<HTMLInputElement | null>
  barRef: RefObject<HTMLElement | null>
  onTabClick: (id: string) => void
}

/** Sticky bar with the global search and the section tabs; stays visible while scrolling. */
export function AppBar({ tabs, current, query, onQuery, placeholder, inputRef, barRef, onTabClick }: Props) {
  const listRef = useRef<HTMLUListElement>(null)
  // On phones the tab row scrolls sideways; show an arrow while tabs are hidden past the right edge.
  const [moreRight, setMoreRight] = useState(false)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () => setMoreRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 4)
    update()
    list.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(list)
    return () => {
      list.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  // Keep the open tab in view when it changes (a hash link, or the remembered tab on load).
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!active || !listRef.current) return
    const list = listRef.current
    const left = active.offsetLeft - list.offsetLeft
    if (left < list.scrollLeft || left + active.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - 16) })
    }
  }, [current])

  const scrollMore = () =>
    listRef.current?.scrollBy({
      left: listRef.current.clientWidth * 0.7,
      behavior: 'smooth',
    })

  return (
    <nav className="appbar" aria-label="Search and sections" ref={barRef} data-cy="app-bar">
      <div className="wrap appbar__inner">
        <label className="search">
          <span className="sr-only">Search</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            id="search"
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                onQuery('')
              }
            }}
            data-cy="search"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => {
                onQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              data-cy="search-clear"
            >
              ×
            </button>
          ) : (
            <kbd className="search__hint" aria-hidden="true">
              /
            </kbd>
          )}
        </label>
        <div className={`tabs-wrap${moreRight ? ' tabs-wrap--more' : ''}`}>
          <ul className="tabs" role="list" ref={listRef}>
            {tabs.map((t, i) => (
              <Fragment key={t.id}>
                {t.group === 'library' && tabs[i - 1]?.group !== 'library' && <li className="tabs__sep" aria-hidden="true" />}
                <li>
                  <a
                    className={t.color ? 'tab tab--role' : 'tab'}
                    href={`#${t.id}`}
                    aria-current={current === t.id ? 'page' : undefined}
                    style={
                      t.color
                        ? ({
                            '--tab-color': `var(--role-${t.color}-ink)`,
                            '--tab-dot': `var(--role-${t.color})`,
                          } as CSSProperties)
                        : undefined
                    }
                    onClick={() => onTabClick(t.id)}
                    data-cy={`tab-${t.id}`}
                  >
                    {t.icon}
                    {t.label}
                    {t.count !== null && t.count !== undefined && (
                      <span className="tab__count" data-cy={`tab-count-${t.id}`} aria-label={t.countLabel ?? `${t.count} unread`}>
                        {t.count}
                      </span>
                    )}
                  </a>
                </li>
              </Fragment>
            ))}
          </ul>
          {moreRight && (
            <button type="button" className="tabs-more" onClick={scrollMore} aria-label="Show more sections" data-cy="tabs-more">
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
