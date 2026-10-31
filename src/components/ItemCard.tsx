import type { CSSProperties } from 'react'
import { fullDate, relativeDate } from '../lib/format'
import { ROLE_LABEL, TIER_HELP, TIER_LABEL } from '../lib/roles'
import type { Item } from '../types'

export interface ItemActions {
  read: ReadonlySet<string>
  saved: ReadonlySet<string>
  newSince: string | null
  now: Date
  onOpen: (id: string) => void
  onToggleRead: (id: string) => void
  /** Gets the whole item so a snapshot can be kept with the bookmark. */
  onToggleSave: (item: Item) => void
}

interface Props extends ItemActions {
  item: Item
  variant?: 'lead' | 'row'
  index?: number
}

export function ItemCard({ item, variant = 'row', index = 0, read, saved, newSince, now, onOpen, onToggleRead, onToggleSave }: Props) {
  const isRead = read.has(item.id)
  const isSaved = saved.has(item.id)
  const isNew = !isRead && newSince !== null && item.firstSeenAt > newSince
  const Heading = variant === 'lead' ? 'h3' : 'h4'
  const classes = ['item', variant === 'lead' ? 'lead' : '', isRead ? 'item--read' : ''].filter(Boolean).join(' ')

  return (
    <article className={classes} style={{ '--i': index } as CSSProperties} data-cy="item" data-id={item.id} data-read={isRead}>
      <div className="item__gutter" aria-hidden="true" title={isNew ? 'New since your last visit' : undefined}>
        {isNew ? '+' : ''}
      </div>
      <div className="item__body">
        {variant === 'lead' && <div className="lead__kicker">Lead · {ROLE_LABEL[item.roles[0]]}</div>}
        <div className="item__meta mono">
          <span className="item__source">{item.sourceName}</span>
          <span className={`tier tier--${item.tier}`} title={TIER_HELP[item.tier]} data-cy="tier">
            {TIER_LABEL[item.tier]}
          </span>
          <time dateTime={item.publishedAt} title={fullDate(item.publishedAt)}>
            {relativeDate(item.publishedAt, now)}
          </time>
          {isNew && <span className="sr-only">New since your last visit</span>}
          {isRead && (
            <span className="pill pill--read" data-cy="read-pill">
              Read
            </span>
          )}
        </div>
        <Heading className="item__title">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(item.id)} data-cy="item-link">
            {item.title}
          </a>
        </Heading>
        {item.summary && (
          <p className="item__summary" data-cy="item-summary">
            {item.summary}
          </p>
        )}
        {item.whyItMatters && (
          <p className="item__why" data-cy="item-why">
            <b>Why it matters</b>
            {item.whyItMatters}
          </p>
        )}
        <div className="item__foot">
          {item.roles.map((r) => (
            <span key={r} className={`chip role-${r}`} data-cy="role-chip">
              {ROLE_LABEL[r]}
            </span>
          ))}
          {item.discussionUrl && item.discussionUrl !== item.url && (
            <a className="text-link" href={item.discussionUrl} target="_blank" rel="noopener noreferrer">
              HN discussion
            </a>
          )}
          <div className="item__actions">
            <button
              type="button"
              className="icon-btn"
              aria-pressed={isRead}
              onClick={() => onToggleRead(item.id)}
              data-cy="toggle-read"
              title={isRead ? 'Mark as unread again' : 'Marks this as read and removes it from the unread counts'}
            >
              {isRead ? '✓ Read' : 'Mark read'}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-pressed={isSaved}
              onClick={() => onToggleSave(item)}
              data-cy="toggle-save"
              title={isSaved ? 'Remove from Saved' : 'Keep this in the Saved tab (stays in this browser)'}
              aria-label={isSaved ? `Remove bookmark: ${item.title}` : `Bookmark: ${item.title}`}
            >
              {isSaved ? '★ Saved' : '☆ Save'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
