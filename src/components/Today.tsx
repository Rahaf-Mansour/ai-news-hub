import { ROLE_NAME } from '../lib/roles'
import type { TodayView } from '../lib/today'
import { ItemCard, type ItemActions } from './ItemCard'

export function Today({ view, ...actions }: { view: TodayView } & ItemActions) {
  let index = 1
  return (
    <section className="today" aria-labelledby="today-heading" data-cy="today">
      <div className="wrap">
        <div className="section-head">
          <h2 id="today-heading">Today</h2>
          <p className="mono" data-cy="today-window">
            {view.count} that matter from the last {view.windowLabel}
          </p>
        </div>
        {!view.lead ? (
          <p className="empty">Nothing new in the last week. The next run is at 05:30 UTC.</p>
        ) : (
          <div className="today__grid">
            <ItemCard item={view.lead} variant="lead" {...actions} />
            <div className="today__groups">
              {view.groups.map((group) => (
                <div key={group.role} className={`role-group role-${group.role}`} data-cy={`today-group-${group.role}`}>
                  <h3>{ROLE_NAME[group.role]}</h3>
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} index={index++} {...actions} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
