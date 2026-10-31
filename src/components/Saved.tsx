import { useState } from 'react'
import { matchesQuery, matchesWords } from '../lib/filter'
import { ROLE_LABEL } from '../lib/roles'
import { savedMarkdown, type SavedItem, type SavedRepo, type SavedStep } from '../lib/saved'
import type { SavedEntry } from '../lib/storage'
import { ItemCard, type ItemActions } from './ItemCard'

type Listed<T> = SavedEntry<T> & { id: string }

interface Props extends ItemActions {
  items: Listed<SavedItem>[]
  repos: Listed<SavedRepo>[]
  steps: Listed<SavedStep>[]
  query: string
  onUnsaveRepo: (id: string) => void
  onUnsaveStep: (id: string) => void
  onClearAll: () => void
  onCopied: (count: number) => void
}

/** Everything saved in this browser: articles and news, repos and learning steps. */
export function Saved({ items, repos, steps, query, onUnsaveRepo, onUnsaveStep, onClearAll, onCopied, ...actions }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [fallbackText, setFallbackText] = useState<string | null>(null)
  const total = items.length + repos.length + steps.length

  const shownItems = items.filter((e) => matchesQuery(e.data, query))
  const shownRepos = repos.filter((e) => matchesWords([e.data.fullName, e.data.why, e.data.note, ...e.data.roles.map((r) => ROLE_LABEL[r])], query))
  const shownSteps = steps.filter((e) => matchesWords([e.data.title, e.data.source, e.data.why, e.data.track], query))
  const shown = shownItems.length + shownRepos.length + shownSteps.length

  const copy = async () => {
    const text = savedMarkdown(items.map((e) => e.data), repos.map((e) => e.data), steps.map((e) => e.data))
    try {
      await navigator.clipboard.writeText(text)
      setFallbackText(null)
      onCopied(total)
    } catch {
      // Clipboard blocked: show the text so it can be copied by hand.
      setFallbackText(text)
    }
  }

  return (
    <section aria-labelledby="saved-heading" data-cy="saved">
      <div className="section-head">
        <h2 id="saved-heading">Saved</h2>
        <p className="mono">
          {total} saved · stays in this browser
        </p>
      </div>

      {total === 0 ? (
        <p className="empty" data-cy="saved-empty">
          Nothing saved yet. Tap ☆ Save on any item, repo or learning step to keep it here. Saved items stay in this browser.
        </p>
      ) : (
        <>
          <div className="toolbar saved-tools">
            <button type="button" className="btn" onClick={copy} data-cy="copy-links">
              Copy links as Markdown
            </button>
            {confirming ? (
              <span className="confirm" data-cy="clear-confirm">
                Remove all {total} saved?{' '}
                <button type="button" className="btn btn--danger" onClick={() => { onClearAll(); setConfirming(false) }} data-cy="clear-yes">
                  Yes, clear all
                </button>{' '}
                <button type="button" className="btn" onClick={() => setConfirming(false)} data-cy="clear-no">
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className="btn" onClick={() => setConfirming(true)} data-cy="clear-saved">
                Clear all saved
              </button>
            )}
          </div>
          {fallbackText && (
            <label className="copy-fallback">
              Your browser blocked copying. Select the text below and copy it:
              <textarea id="saved-markdown" data-cy="copy-fallback" readOnly value={fallbackText} rows={6} onFocus={(e) => e.target.select()} autoFocus />
            </label>
          )}
          {query && shown === 0 && (
            <p className="empty" data-cy="no-results">
              Nothing saved matches “{query}”.
            </p>
          )}

          {shownItems.length > 0 && (
            <div className="saved-group" data-cy="saved-items">
              <h3>Articles &amp; news <span className="mono">{shownItems.length}</span></h3>
              {shownItems.map((e) => (
                <ItemCard key={e.id} item={e.data} {...actions} />
              ))}
            </div>
          )}

          {shownRepos.length > 0 && (
            <div className="saved-group" data-cy="saved-repos">
              <h3>Repos <span className="mono">{shownRepos.length}</span></h3>
              <ul className="saved-list">
                {shownRepos.map((e) => (
                  <li key={e.id} data-cy="saved-repo" data-repo={e.id}>
                    <div>
                      <a className="repo-name" href={e.data.url} target="_blank" rel="noopener noreferrer">
                        {e.data.fullName}
                      </a>
                      <p className="repo-why">{e.data.why}</p>
                    </div>
                    <button type="button" className="icon-btn" aria-pressed="true" onClick={() => onUnsaveRepo(e.id)} data-cy="saved-repo-remove" aria-label={`Remove ${e.data.fullName} from Saved`}>
                      ★ Saved
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shownSteps.length > 0 && (
            <div className="saved-group" data-cy="saved-steps">
              <h3>Learning steps <span className="mono">{shownSteps.length}</span></h3>
              <ul className="saved-list">
                {shownSteps.map((e) => (
                  <li key={e.id} data-cy="saved-step" data-step={e.id}>
                    <div>
                      <a className="repo-name" href={e.data.url} target="_blank" rel="noopener noreferrer">
                        {e.data.title}
                      </a>
                      <p className="repo-why">
                        <span className="mono">{e.data.track} · {e.data.source}</span>
                      </p>
                    </div>
                    <button type="button" className="icon-btn" aria-pressed="true" onClick={() => onUnsaveStep(e.id)} data-cy="saved-step-remove" aria-label={`Remove ${e.data.title} from Saved`}>
                      ★ Saved
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
