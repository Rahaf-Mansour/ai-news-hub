import type { ReactNode } from 'react'
import { AlertIcon, CheckCircleIcon, InboxIcon, MoonIcon, SparkleIcon, StarIcon, SunIcon } from './Icons'
import { fullDate, relativeDate } from '../lib/format'
import type { ItemsFile, SourcesStatusFile } from '../types'

export type Theme = 'light' | 'dark'

interface Props {
  items: ItemsFile | null
  status: SourcesStatusFile | null
  unread: number
  newCount: number
  savedCount: number
  now: Date
  /** The theme in use: the reader's choice, or the OS setting until they make one. */
  theme: Theme
  onToggleTheme: () => void
  /** Extra run-strip content (next refresh), rendered after "Updated". */
  runExtra?: ReactNode
  byline?: ReactNode
}

export function Masthead({ items, status, unread, newCount, savedCount, now, theme, onToggleTheme, runExtra, byline }: Props) {
  const ok = status?.sources.filter((s) => s.ok).length ?? 0
  const total = status?.sources.length ?? 0
  const failed = total - ok
  const today = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="masthead" data-cy="masthead">
      <div className="masthead__run mono">
        <div className="wrap run__inner">
          <span data-cy="run-date">{today}</span>
          <span className="run__summary" data-cy="run-summary">
            {items && (
              <span>
                Updated{' '}
                <time dateTime={items.generatedAt} title={fullDate(items.generatedAt)} data-cy="last-updated">
                  {relativeDate(items.generatedAt, now)}
                </time>
              </span>
            )}
            {runExtra}
            {status && (
              <>
                <span className="run__pass">✓ {ok} sources passed</span>
                {failed > 0 && <span className="run__fail">✗ {failed} failed</span>}
              </>
            )}
            {items && <span>{items.items.length} items · 30 days</span>}
            {newCount > 0 && <span className="run__pass">+{newCount} new since your last visit</span>}
          </span>
        </div>
      </div>
      <div className="hero">
        <div className="wrap hero__inner">
          <div className="hero__title">
            <h1 className="wordmark" data-cy="wordmark">
              AI News <span className="wordmark__amp">&amp;</span> <span className="wordmark__accent">Learning</span> Hub
            </h1>
            {byline}
            <p className="tagline" data-cy="tagline">What changed in AI today, read through five lenses: Claude, QA, product, full-stack and AI dev tools.</p>
          </div>
          <div className="hero__side">
            <dl className="stats" data-cy="stats">
              <Stat icon={<InboxIcon />} label="Unread" value={unread} cy="unread-total" tone="accent" />
              <Stat icon={<SparkleIcon />} label="New since last visit" short="New" value={newCount} cy="stat-new" tone="new" />
              <Stat icon={<StarIcon />} label="Saved" value={savedCount} cy="stat-saved" tone="gold" />
              <Stat
                icon={failed ? <AlertIcon /> : <CheckCircleIcon />}
                label="Sources OK"
                short="Sources"
                value={status ? `${ok}/${total}` : '–'}
                cy="stat-sources"
                tone={failed ? 'warn' : 'teal'}
              />
            </dl>
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              data-cy="theme-toggle"
              aria-label={theme === 'dark' ? 'Dark theme. Switch to light.' : 'Light theme. Switch to dark.'}
              title={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
            >
              {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

interface StatProps {
  icon: ReactNode
  label: string
  short?: string
  value: number | string
  cy: string
  tone: string
}

function Stat({ icon, label, short, value, cy, tone }: StatProps) {
  return (
    <div className={`stat stat--${tone}`} data-cy={cy} aria-live="polite">
      <dt>
        {icon}
        {short ? (
          <>
            <span className="stat__long">{label}</span>
            <span className="stat__short" aria-hidden="true">{short}</span>
          </>
        ) : (
          label
        )}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}
