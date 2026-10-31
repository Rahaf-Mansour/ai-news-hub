import { Fragment, useState } from 'react'
import { TRACKS, type LearnStep } from '../content/learn'
import { matchesStep } from '../lib/filter'
import { getItem, KEYS, setItem, useStoredSet } from '../lib/storage'

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
              className="facet"
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
            <article key={track.id} className="track" data-cy={`track-${track.id}`}>
              <h2>{track.name}</h2>
              <p className="track__for">{track.for}</p>
              <p className="mono" style={{ color: 'var(--ink-3)', margin: 0 }}>
                {track.steps.length} steps · about {hours} hours
              </p>
              <div className="progress" aria-hidden="true">
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
              <ol className="steps">
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
                    <li className={`step${isDone ? ' step--done' : ''}`} data-cy="learn-step">
                      <input
                        id={`step-${step.id}`}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => done.toggle(step.id)}
                        aria-label={`Mark "${step.title}" as done`}
                      />
                      <div>
                        <a className="step__title" href={step.url} target="_blank" rel="noopener noreferrer">
                          <span className="step__num">{String(index + 1).padStart(2, '0')}</span> {step.title}
                        </a>
                        <div className="mono" style={{ color: 'var(--ink-3)' }}>
                          {step.source} · {step.minutes} min
                        </div>
                        <p>{step.why}</p>
                        {step.note && <p className="mono" style={{ color: 'var(--warn)' }}>{step.note}</p>}
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
              <p className="mono" style={{ color: 'var(--ink-2)', marginTop: '0.75rem' }}>
                Outcome: {track.outcome}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
