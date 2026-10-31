import type { CSSProperties } from 'react'
import { fullDate, relativeDate } from '../lib/format'
import { primaryRole, ROLE_LABEL, TIER_HELP, TIER_LABEL } from '../lib/roles'
import type { Item } from '../types'
import { Highlight } from './Highlight'

export interface ItemActions {
  read: ReadonlySet<string>
  saved: ReadonlySet<string>
  newSince: string | null
  now: Date
  /** The current search, highlighted in titles. */
  highlight: string
  /** "Why it matters" lines only exist when the LLM step ran; hide stale ones otherwise. */
  showWhy: boolean
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

export function ItemCard({ item, variant = 'row', index = 0, read, saved, newSince, now, highlight, showWhy, onOpen, onToggleRead, onToggleSave }: Props) {
  const isRead = read.has(item.id)
  const isSaved = saved.has(item.id)
  const isNew = !isRead && newSince !== null && item.firstSeenAt > newSince
  const Heading = variant === 'lead' ? 'h3' : 'h4'
  const classes = ['item', `role-${primaryRole(item.roles)}`, variant === 'lead' ? 'lead' : '', isRead ? 'item--read' : ''].filter(Boolean).join(' ')

  return (
    <article className={classes} style={{ '--i': index } as CSSProperties} data-cy="item" data-id={item.id} data-read={isRead}>
      <div className="item__gutter" aria-hidden="true" title={isNew ? 'New since your last visit' : undefined} data-cy="item-new-marker">
        {isNew ? '+' : ''}
      </div>
      <div className="item__body">
        {variant === 'lead' && <div className="lead__kicker" data-cy="lead-kicker">Lead · {ROLE_LABEL[item.roles[0]]}</div>}
        <div className="item__meta mono" data-cy="item-meta">
          <span className="item__source" data-cy="item-source">{item.sourceName}</span>
          <span className={`tier tier--${item.tier}`} title={TIER_HELP[item.tier]} data-cy="tier">
            {TIER_LABEL[item.tier]}
          </span>
          <time dateTime={item.publishedAt} title={fullDate(item.publishedAt)} data-cy="item-date">
            {relativeDate(item.publishedAt, now)}
          </time>
          {isNew && <span className="sr-only">New since your last visit</span>}
          {isRead && (
            <span className="pill pill--read" data-cy="read-pill">
              Read
            </span>
          )}
        </div>
        <Heading className="item__title" data-cy="item-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(item.id)} data-cy="item-link">
            <Highlight text={item.title} query={highlight} />
          </a>
        </Heading>
        {item.summary && (
          <p className="item__summary" data-cy="item-summary">
            {item.summary}
          </p>
        )}
        {showWhy && item.whyItMatters && (
          <p className="item__why" data-cy="item-why">
            <b>Why it matters</b>
            {item.whyItMatters}
          </p>
        )}
        <div className="item__foot" data-cy="item-roles">
          {item.roles.map((r) => (
            <span key={r} className={`chip role-${r}`} data-cy="role-chip" data-role={r}>
              {ROLE_LABEL[r]}
            </span>
          ))}
          {item.discussionUrl && item.discussionUrl !== item.url && (
            <a className="text-link" data-cy="item-discussion" href={item.discussionUrl} target="_blank" rel="noopener noreferrer">
              HN discussion
            </a>
          )}
          <div className="item__actions" data-cy="item-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onToggleRead(item.id)}
              data-cy="toggle-read"
              title={isRead ? 'Marks this as unread again and adds it back to the unread counts' : 'Marks this as read and removes it from the unread counts'}
            >
              {isRead ? 'Mark unread' : 'Mark read'}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-pressed={isSaved}
              onClick={() => onToggleSave(item)}
              data-cy="toggle-save"
              title={isSaved ? 'Remove from Saved' : 'Keep this in the Saved tab (stays in this browser)'}
              aria-label={`Save: ${item.title}`}
            >
              {isSaved ? '★ Saved' : '☆ Save'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
