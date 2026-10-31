import { MODEL_WATCH } from '../content/modelWatch'
import { CLAUDE_TIMELINE } from '../content/claudeTimeline'
import { matchesWords } from '../lib/filter'
import { fullDate, relativeDate, shortDate } from '../lib/format'
import { TIER_LABEL } from '../lib/roles'
import type { SourcesStatusFile } from '../types'

export function ModelWatch() {
  return (
    <section className="panel" aria-labelledby="watch-heading" data-cy="model-watch">
      <h2 id="watch-heading">Model watch</h2>
      <p>Leaderboards change weekly and disagree with each other, so this page links out instead of copying their numbers.</p>
      <ul className="watch">
        {MODEL_WATCH.map((m) => (
          <li key={m.name} data-cy="model-watch-entry" data-model={m.name}>
            <a href={m.url} target="_blank" rel="noopener noreferrer" data-cy="model-watch-link">
              {m.name} ↗
            </a>
            <p>{m.what}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RunLog({ status, now }: { status: SourcesStatusFile | null; now: Date }) {
  if (!status) return null
  const failed = status.sources.filter((s) => !s.ok).length
  return (
    <details className="panel" open={failed > 0} data-cy="run-log">
      <summary>
        <h2>Sources</h2>{' '}
        <span className="mono" style={{ color: failed ? 'var(--warn)' : 'var(--ink-3)' }}>
          {status.sources.length - failed}/{status.sources.length} fetched
        </span>
      </summary>
      <p style={{ marginTop: '0.6rem' }}>Last fetch time per source. A failed source is skipped and keeps its older items.</p>
      <ul className="runlog">
        {status.sources.map((s) => (
          <li key={s.id} data-cy="source-row" data-source={s.id} title={s.error ? `Error: ${s.error}` : `${TIER_LABEL[s.tier]} · ${s.count} items`}>
            <span className={s.ok ? 'ok' : 'bad'} aria-label={s.ok ? 'Fetched' : 'Failed'} data-cy="source-status">
              {s.ok ? '✓' : '✗'}
            </span>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
            <time className="mono" dateTime={s.lastFetched} title={fullDate(s.lastFetched)} style={{ color: 'var(--ink-3)' }}>
              {s.ok ? relativeDate(s.lastFetched, now) : s.lastSuccess ? `ok ${shortDate(s.lastSuccess)}` : 'failed'}
            </time>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function ClaudeTimeline({ query }: { query: string }) {
  const entries = CLAUDE_TIMELINE.filter((e) => matchesWords([e.title, e.detail], query))
  if (query && entries.length === 0) return null
  return (
    <details className="timeline" open data-cy="claude-timeline">
      <summary>
        Claude in 2026: releases at a glance
        {query && (
          <span className="mono" style={{ fontWeight: 400, color: 'var(--ink-3)', marginLeft: '0.5rem' }} data-cy="timeline-count">
            {entries.length} of {CLAUDE_TIMELINE.length} match
          </span>
        )}
      </summary>
      <ol>
        {entries.map((e) => (
          <li key={`${e.date}-${e.title}`} data-cy="timeline-entry" data-date={e.date}>
            <time className="mono" dateTime={e.date}>
              {shortDate(`${e.date}T12:00:00Z`)}
            </time>
            <div>
              <h3>
                <a href={e.url} target="_blank" rel="noopener noreferrer" data-cy="timeline-link">
                  {e.title}
                </a>
              </h3>
              <p>{e.detail}</p>
              {e.correction && <p className="correction" data-cy="timeline-correction">{e.correction}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="mono" style={{ color: 'var(--ink-3)', margin: '0.25rem 0 0.75rem' }}>
        Each entry links to an Anthropic or Claude page, checked Oct 31, 2026.
      </p>
    </details>
  )
}
