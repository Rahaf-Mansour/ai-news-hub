import type { FilterState, ShowFilter } from '../lib/filter'
import { TIER_LABEL } from '../lib/roles'
import type { Item, SourceType, TrustTier } from '../types'
import { ItemCard, type ItemActions } from './ItemCard'

const TIERS: TrustTier[] = ['official', 'editorial', 'community']
const TYPES: { id: SourceType; label: string }[] = [
  { id: 'release', label: 'Releases' },
  { id: 'news', label: 'News' },
  { id: 'article', label: 'Articles' },
]
const SHOW: { id: ShowFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'saved', label: 'Saved' },
]

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface Props extends ItemActions {
  items: Item[]
  total: number
  filter: FilterState
  setFilter: (f: FilterState) => void
  onMarkAllRead: (ids: string[]) => void
  label: string
}

export function Feed({ items, total, filter, setFilter, onMarkAllRead, label, ...actions }: Props) {
  const unreadHere = items.filter((i) => !actions.read.has(i.id))
  return (
    <section aria-label={`${label} feed`} data-cy="feed">
      <div className="toolbar">
        <label className="search">
          <span className="sr-only">Search {label}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            id="search"
            type="search"
            placeholder={`Search ${label.toLowerCase()}: titles, summaries, sources`}
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            data-cy="search"
            autoComplete="off"
          />
        </label>
        <div className="filters" role="group" aria-label="Show">
          {SHOW.map((s) => (
            <button
              key={s.id}
              type="button"
              className="toggle"
              aria-pressed={filter.show === s.id}
              onClick={() => setFilter({ ...filter, show: s.id })}
              data-cy={`show-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <div className="filters" role="group" aria-label="Trust tier">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              className="toggle"
              aria-pressed={filter.tiers.includes(t)}
              onClick={() => setFilter({ ...filter, tiers: toggleIn(filter.tiers, t) })}
              data-cy={`tier-${t}`}
            >
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="filters" role="group" aria-label="Type">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="toggle"
              aria-pressed={filter.types.includes(t.id)}
              onClick={() => setFilter({ ...filter, types: toggleIn(filter.types, t.id) })}
              data-cy={`type-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="result-line mono" aria-live="polite">
        <span data-cy="result-count">
          {items.length} of {total} items
        </span>
        {unreadHere.length > 0 && (
          <button type="button" className="icon-btn" onClick={() => onMarkAllRead(unreadHere.map((i) => i.id))} data-cy="mark-all-read">
            Mark {unreadHere.length} shown as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="empty" data-cy="no-results">
          No items match. Clear the search or turn off a filter.
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} {...actions} />
          ))}
        </div>
      )}
    </section>
  )
}
