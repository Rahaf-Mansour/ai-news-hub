import { fullDate, relativeDate } from '../lib/format'
import type { ItemsFile, SourcesStatusFile } from '../types'

export type ThemeChoice = 'system' | 'light' | 'dark'

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' }

interface Props {
  items: ItemsFile | null
  status: SourcesStatusFile | null
  unread: number
  newCount: number
  now: Date
  theme: ThemeChoice
  onTheme: (t: ThemeChoice) => void
}

export function Masthead({ items, status, unread, newCount, now, theme, onTheme }: Props) {
  const ok = status?.sources.filter((s) => s.ok).length ?? 0
  const failed = status ? status.sources.length - ok : 0
  const today = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="masthead">
      <div className="wrap masthead__run mono">
        <span>{today}</span>
        <span className="run__summary" data-cy="run-summary">
          {items && (
            <span>
              Updated{' '}
              <time dateTime={items.generatedAt} title={fullDate(items.generatedAt)} data-cy="last-updated">
                {relativeDate(items.generatedAt, now)} · {fullDate(items.generatedAt)}
              </time>
            </span>
          )}
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
      <div className="wrap masthead__main">
        <div>
          <h1 className="wordmark">
            AI News <span className="wordmark__amp">&amp;</span> Learning Hub
          </h1>
          <p className="tagline">What changed in AI today, read through four lenses: Claude, QA, product and engineering.</p>
        </div>
        <div className="masthead__side">
          <div className="unread-total" data-cy="unread-total" aria-live="polite">
            {unread}
            <small>unread</small>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => onTheme(NEXT[theme])}
            data-cy="theme-toggle"
            aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]]}.`}
          >
            <span className="theme-toggle__dot" aria-hidden="true" />
            {LABEL[theme]}
          </button>
        </div>
      </div>
    </header>
  )
}
