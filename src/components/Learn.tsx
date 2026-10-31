import { Fragment, useState } from 'react'
import { TRACKS, type LearnStep } from '../content/learn'
import { matchesStep } from '../lib/filter'
import { getItem, KEYS, setItem, useStoredSet } from '../lib/storage'

/** 45 → "45 min", 150 → "2.5 hr" (the way Claude Academy writes course lengths). */
const formatLength = (minutes: number) => (minutes < 60 ? `${minutes} min` : `${Math.round((minutes / 60) * 2) / 2} hr`)

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five']

const initialTrack = () => {
  const stored = getItem(KEYS.learnTrack)
  return TRACKS.some((t) => t.id === stored) ? (stored as string) : TRACKS[0].id
}

interface Props {
  query: string
  savedIds: ReadonlySet<string>
  onToggleSave: (step: LearnStep, trackName: string) => void
}

export function Learn({ query, savedIds, onToggleSave }: Props) {
  const done = useStoredSet(KEYS.learn)
  const [active, setActive] = useState(initialTrack)
  const pick = (id: string) => {
    setActive(id)
    setItem(KEYS.learnTrack, id)
  }
  const completedIn = (steps: LearnStep[]) => steps.filter((s) => done.set.has(s.id)).length

  // One track at a time; a search shows matches from every track.
  const visible = TRACKS.filter((track) => query || track.id === active)
    .map((track) => ({
      track,
      steps: track.steps.map((step, index) => ({ step, index })).filter(({ step }) => matchesStep(step, track.name, query)),
    }))
    .filter((t) => t.steps.length > 0)

  return (
    <section aria-labelledby="learn-heading" data-cy="learn">
      <div className="section-head">
        <h2 id="learn-heading">Learn</h2>
        <p>
          {NUMBER_WORDS[TRACKS.length] ?? TRACKS.length} tracks, in order. Tick a step when you finish it; progress stays in this browser.
        </p>
      </div>
      {!query && (
        <div className="facets facets--tracks" role="group" aria-label="Learning track" data-cy="track-picker">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              className={`facet facet--track role-${track.role}`}
              aria-pressed={track.id === active}
              onClick={() => pick(track.id)}
              data-cy={`track-pick-${track.id}`}
            >
              {track.name}
              <span className="facet__count">
                {completedIn(track.steps)}/{track.steps.length}
              </span>
            </button>
          ))}
        </div>
      )}
      {visible.length === 0 && (
        <p className="empty" data-cy="no-results">
          No steps match “{query}”. Clear the search to see every track.
        </p>
      )}
      <div className="tracks">
        {visible.map(({ track, steps }) => {
          const completed = completedIn(track.steps)
          const hours = Math.round(track.steps.reduce((sum, s) => sum + s.minutes, 0) / 30) / 2
          return (
            <article key={track.id} className={`track role-${track.role}`} data-cy={`track-${track.id}`} data-track={track.id}>
              <div className="track__head">
                <div>
                  <h2 data-cy="track-name">{track.name}</h2>
                  <p className="track__for" data-cy="track-for">{track.for}</p>
                  <p className="mono" style={{ color: 'var(--ink-3)', margin: 0 }} data-cy="track-length">
                    {track.steps.length} steps · about {hours} hours
                  </p>
                </div>
                <ProgressRing done={completed} total={track.steps.length} />
              </div>
              <div className="progress" aria-hidden="true" data-cy="track-progress-bar">
                <span style={{ width: `${(completed / track.steps.length) * 100}%` }} />
              </div>
              <p className="mono" style={{ margin: 0 }} data-cy="track-progress">
                {completed} of {track.steps.length} done
              </p>
              {query && steps.length < track.steps.length && (
                <p className="mono" style={{ color: 'var(--ink-3)', margin: '0.4rem 0 0' }} data-cy="track-matches">
                  {steps.length} of {track.steps.length} steps match
                </p>
              )}
              <ol className="steps" data-cy="track-steps">
                {steps.map(({ step, index }, i) => {
                  const isDone = done.set.has(step.id)
                  const newSection = step.section && step.section !== steps[i - 1]?.step.section
                  return (
                    <Fragment key={step.id}>
                    {newSection && (
                      <li className="step-section" data-cy="step-section">
                        {step.section}
                      </li>
                    )}
                    <li className={`step${isDone ? ' step--done' : ''}`} data-cy="learn-step" data-step={step.id}>
                      <input
                        id={`step-${step.id}`}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => done.toggle(step.id)}
                        aria-label={`Mark "${step.title}" as done`}
                        data-cy="step-done"
                      />
                      <div>
                        <a className="step__title" href={step.url} target="_blank" rel="noopener noreferrer" data-cy="step-link">
                          <span className="step__num">{String(index + 1).padStart(2, '0')}</span> {step.title}
                        </a>
                        <div className="mono" style={{ color: 'var(--ink-3)' }} data-cy="step-meta">
                          {step.source} · {formatLength(step.minutes)}
                        </div>
                        <p data-cy="step-why">{step.why}</p>
                        {step.note && (
                          <p className="mono" style={{ color: 'var(--warn)' }} data-cy="step-note">
                            {step.note}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-btn step__save"
                        aria-pressed={savedIds.has(step.id)}
                        onClick={() => onToggleSave(step, track.name)}
                        data-cy="step-save"
                        aria-label={savedIds.has(step.id) ? `Remove "${step.title}" from Saved` : `Save "${step.title}"`}
                      >
                        {savedIds.has(step.id) ? '★' : '☆'}
                      </button>
                    </li>
                    </Fragment>
                  )
                })}
              </ol>
              <p className="mono" style={{ color: 'var(--ink-2)', marginTop: '0.75rem' }} data-cy="track-outcome">
                Outcome: {track.outcome}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  const r = 22
  const circumference = 2 * Math.PI * r
  return (
    <div className="ring" aria-hidden="true" data-cy="track-ring">
      <svg viewBox="0 0 52 52" width="56" height="56">
        <circle className="ring__track" cx="26" cy="26" r={r} />
        <circle
          className="ring__bar"
          cx="26"
          cy="26"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
      <span className="ring__pct mono">{pct}%</span>
    </div>
  )
}
