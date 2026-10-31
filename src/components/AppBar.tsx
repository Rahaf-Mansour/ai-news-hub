import type { CSSProperties, ReactNode, RefObject } from 'react'

export interface TabDef {
  id: string
  label: string
  /** Role colour token name, e.g. "claude" → var(--role-claude). */
  color?: string
  icon?: ReactNode
  count?: number | null
  countLabel?: string
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
            <button type="button" className="search__clear" onClick={() => { onQuery(''); inputRef.current?.focus() }} aria-label="Clear search" data-cy="search-clear">
              ×
            </button>
          ) : (
            <kbd className="search__hint" aria-hidden="true">/</kbd>
          )}
        </label>
        <ul className="tabs" role="list">
          {tabs.map((t) => (
            <li key={t.id}>
              <a
                className="tab"
                href={`#${t.id}`}
                aria-current={current === t.id ? 'page' : undefined}
                style={t.color ? ({ '--tab-color': `var(--role-${t.color})` } as CSSProperties) : undefined}
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
          ))}
        </ul>
      </div>
    </nav>
  )
}
