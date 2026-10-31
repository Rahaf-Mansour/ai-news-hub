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
  label: string
  /** Optional facet row above the filters (Frontend/Backend, Manual/Automation…). */
  facets?: ReactNode
}

export function Feed({ items, total, filter, setFilter, onMarkAllRead, label, facets, ...actions }: Props) {
  const unreadHere = items.filter((i) => !actions.read.has(i.id))
  return (
    <section aria-label={`${label} feed`} data-cy="feed">
      {facets}
      <div className="toolbar">
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
          className="toggle toggle--saved"
          aria-pressed={filter.savedOnly}
          onClick={() => setFilter({ ...filter, savedOnly: !filter.savedOnly })}
          data-cy="saved-only"
          title="Show only items you saved"
        >
          ★ Saved only
        </button>
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
          {filter.query ? `No items match “${filter.query}”.` : 'No items match.'} Clear the search or turn off a filter.
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
