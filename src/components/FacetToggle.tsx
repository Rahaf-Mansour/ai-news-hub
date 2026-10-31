export interface FacetOption<T extends string> {
  id: T | 'all'
  label: string
  count?: number
}

interface Props<T extends string> {
  label: string
  options: FacetOption<T>[]
  value: T | 'all'
  onChange: (value: T | 'all') => void
}

/** A segmented sub-filter inside a section, e.g. QA: All · Manual & exploratory · Automation · Testing AI. */
export function FacetToggle<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="facets" role="group" aria-label={label} data-cy="facets">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="facet"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          data-cy={`facet-${o.id}`}
        >
          {o.label}
          {o.count !== undefined && <span className="facet__count">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
