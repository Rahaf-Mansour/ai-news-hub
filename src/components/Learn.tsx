import { TRACKS } from '../content/learn'
import { KEYS, useStoredSet } from '../lib/storage'

export function Learn() {
  const done = useStoredSet(KEYS.learn)
  return (
    <section aria-labelledby="learn-heading" data-cy="learn">
      <div className="section-head">
        <h2 id="learn-heading">Learn</h2>
        <p>Two tracks, in order. Tick a step when you finish it; progress stays in this browser.</p>
      </div>
      <div className="tracks">
        {TRACKS.map((track) => {
          const completed = track.steps.filter((s) => done.set.has(s.id)).length
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
              <ol className="steps">
                {track.steps.map((step) => {
                  const isDone = done.set.has(step.id)
                  return (
                    <li key={step.id} className={`step${isDone ? ' step--done' : ''}`}>
                      <input
                        id={`step-${step.id}`}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => done.toggle(step.id)}
                        aria-label={`Mark "${step.title}" as done`}
                      />
                      <div>
                        <a className="step__title" href={step.url} target="_blank" rel="noopener noreferrer">
                          {step.title}
                        </a>
                        <div className="mono" style={{ color: 'var(--ink-3)' }}>
                          {step.source} · {step.minutes} min
                        </div>
                        <p>{step.why}</p>
                        {step.note && <p className="mono" style={{ color: 'var(--warn)' }}>{step.note}</p>}
                      </div>
                    </li>
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
