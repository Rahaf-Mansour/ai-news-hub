import type { ReactNode } from 'react'
import type { FilterState } from '../lib/filter'
import { TIER_LABEL } from '../lib/roles'
import type { Item, SourceType, TrustTier } from '../types'
import { ItemCard, type ItemActions } from './ItemCard'

const TIERS: TrustTier[] = ['official', 'editorial', 'community']
const TYPES: { id: SourceType; label: string }[] = [
  { id: 'release', label: 'Releases' },
  { id: 'news', label: 'News' },
  { id: 'article', label: 'Articles' },
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
  onMarkAllUnread: (ids: string[]) => void
  label: string
  /** Optional facet row above the filters (Frontend/Backend, Manual/Automation…). */
  facets?: ReactNode
}

export function Feed({ items, total, filter, setFilter, onMarkAllRead, onMarkAllUnread, label, facets, ...actions }: Props) {
  const unreadHere = items.filter((i) => !actions.read.has(i.id))
  const readHere = items.filter((i) => actions.read.has(i.id))
  const showingAll = !filter.savedOnly && filter.tiers.length === 0 && filter.types.length === 0
  return (
    <section aria-label={`${label} feed`} data-cy="feed">
      {facets}
      <div className="toolbar" data-cy="feed-toolbar">
        <label className="switch" title="Hide items you have opened or marked as read">
          <input
            id="hide-read"
            type="checkbox"
            checked={filter.hideRead}
            onChange={(e) => setFilter({ ...filter, hideRead: e.target.checked })}
            data-cy="hide-read"
          />
          <span className="switch__track" aria-hidden="true" />
          Hide read
        </label>
        <button
          type="button"
          className="toggle"
          aria-pressed={showingAll}
          onClick={() => setFilter({ ...filter, savedOnly: false, tiers: [], types: [] })}
          data-cy="filter-all"
          title="Clear the Saved, tier and type filters"
        >
          All
        </button>
        <button
          type="button"
          className="toggle toggle--saved"
          aria-pressed={filter.savedOnly}
          onClick={() => setFilter({ ...filter, savedOnly: !filter.savedOnly })}
          data-cy="saved-only"
          title="Show only items you saved"
        >
          ★ Saved only
        </button>
        <div className="filters" role="group" aria-label="Trust tier" data-cy="tier-filters">
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
        <div className="filters" role="group" aria-label="Type" data-cy="type-filters">
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

      <div className="result-line mono" aria-live="polite" data-cy="feed-result-line">
        <span data-cy="result-count">
          {items.length} of {total} items
        </span>
        <span className="result-line__actions">
          {readHere.length > 0 && (
            <button type="button" className="icon-btn" onClick={() => onMarkAllUnread(readHere.map((i) => i.id))} data-cy="mark-all-unread">
              Mark {readHere.length} shown as unread
            </button>
          )}
          {unreadHere.length > 0 && (
            <button type="button" className="icon-btn" onClick={() => onMarkAllRead(unreadHere.map((i) => i.id))} data-cy="mark-all-read">
              Mark {unreadHere.length} shown as read
            </button>
          )}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="empty" data-cy="no-results">
          {filter.query ? `No items match “${filter.query}”.` : 'No items match.'} Clear the search or turn off a filter.
        </p>
      ) : (
        <div data-cy="feed-list">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} {...actions} />
          ))}
        </div>
      )}
    </section>
  )
}
