import { useMemo, useState } from 'react'
import { matchesRepo } from '../lib/filter'
import { formatStars, shortDate } from '../lib/format'
import { primaryRole, ROLE_LABEL, ROLE_ORDER } from '../lib/roles'
import { ClockIcon, StarIcon } from './Icons'
import type { Repo, ReposFile, Role } from '../types'

const STALE_DAYS = 120

interface Props {
  data: ReposFile | null
  now: Date
  query: string
  savedIds: ReadonlySet<string>
  onToggleSave: (repo: Repo) => void
}

export function Repos({ data, now, query, savedIds, onToggleSave }: Props) {
  const [role, setRole] = useState<Role | null>(null)
  const repos = useMemo(
    () =>
      (data?.repos ?? [])
        .filter((r) => (!role || r.roles.includes(role)) && matchesRepo(r, query))
        .sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1)),
    [data, role, query],
  )
  if (!data) return <p className="empty">Repo data is not available yet. Run the daily job to fetch it.</p>
  const verified = data.repos.filter((r) => r.verifiedAt).length
  // Numbers kept from an earlier run because today's GitHub call failed.
  const carried = data.repos.filter((r) => r.verifiedAt && r.verifiedAt.slice(0, 10) !== data.generatedAt.slice(0, 10)).length

  return (
    <section aria-labelledby="repos-heading" data-cy="repos">
      <div className="section-head">
        <h2 id="repos-heading">Repos</h2>
        <p className="mono" data-cy="repos-verified">
          {verified} of {data.repos.length} verified on GitHub · {shortDate(data.generatedAt)}
          {carried > 0 && ` · ${carried} from an earlier check`}
        </p>
      </div>
      <div className="toolbar">
        <div className="filters" role="group" aria-label="Filter repos by role">
          <button type="button" className="toggle" aria-pressed={role === null} onClick={() => setRole(null)}>
            All
          </button>
          {ROLE_ORDER.map((r) => (
            <button key={r} type="button" className="toggle" aria-pressed={role === r} onClick={() => setRole(r)} data-cy={`repos-role-${r}`}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
      <div className="result-line mono" aria-live="polite">
        <span data-cy="repos-count">
          {repos.length} of {data.repos.length} repos
        </span>
      </div>
      {repos.length === 0 && (
        <p className="empty" data-cy="no-results">
          No repos match{query ? ` “${query}”` : ''}. Clear the search or pick another role.
        </p>
      )}
      <ul className="repo-grid" hidden={repos.length === 0}>
        {repos.map((repo) => (
          <RepoCard
            key={repo.fullName}
            repo={repo}
            now={now}
            checkedToday={repo.verifiedAt?.slice(0, 10) === data.generatedAt.slice(0, 10)}
            saved={savedIds.has(repo.fullName)}
            onToggleSave={onToggleSave}
          />
        ))}
      </ul>
      <p className="mono" style={{ color: 'var(--ink-3)', marginTop: '0.75rem' }}>
        Stars and last push come from the GitHub API at build time. A repo shows “not verified” when that call failed; no number is guessed.
      </p>
    </section>
  )
}

interface CardProps {
  repo: Repo
  now: Date
  /** False when today's GitHub call failed and the numbers come from an earlier run. */
  checkedToday: boolean
  saved: boolean
  onToggleSave: (r: Repo) => void
}

function RepoCard({ repo, now, checkedToday, saved, onToggleSave }: CardProps) {
  const stale = repo.lastCommit && now.getTime() - Date.parse(repo.lastCommit) > STALE_DAYS * 86_400_000
  return (
    <li className={`repo-card role-${primaryRole(repo.roles)}`} data-cy="repo-row" data-repo={repo.fullName}>
      <div className="repo-card__head">
        <a className="repo-name" href={repo.url} target="_blank" rel="noopener noreferrer">
          {repo.fullName}
        </a>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={saved}
          onClick={() => onToggleSave(repo)}
          data-cy="repo-save"
          aria-label={saved ? `Remove ${repo.fullName} from Saved` : `Save ${repo.fullName}`}
        >
          {saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
      <p className="repo-why">{repo.why}</p>
      <dl className="repo-stats mono">
        <div>
          <dt>
            <StarIcon width={13} height={13} />
            <span className="sr-only">Stars</span>
          </dt>
          <dd data-cy="repo-stars">
            {repo.stars === null ? (
              <span className="unverified">not verified</span>
            ) : (
              <span title={`${repo.stars.toLocaleString('en-US')} stars, verified ${shortDate(repo.verifiedAt!)}`}>≈{formatStars(repo.stars)}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>
            <ClockIcon width={13} height={13} />
            <span className="sr-only">Last push</span>
          </dt>
          <dd>{repo.lastCommit ? shortDate(repo.lastCommit) : <span className="unverified">not verified</span>}</dd>
        </div>
        {repo.license && (
          <div>
            <dt className="sr-only">License</dt>
            <dd>{repo.license}</dd>
          </div>
        )}
        {repo.verifiedAt && !checkedToday && (
          <div>
            <dt className="sr-only">Checked</dt>
            <dd className="repo-stats__asof" data-cy="repo-asof">
              as of {shortDate(repo.verifiedAt)}
            </dd>
          </div>
        )}
      </dl>
      <div className="repo-card__foot">
        {repo.archived && <span className="flag">Archived</span>}
        {stale && <span className="flag">Quiet {STALE_DAYS}+ days</span>}
        {repo.note && <span className="flag">{repo.note}</span>}
        {repo.roles.map((r) => (
          <span key={r} className={`chip role-${r}`}>
            {ROLE_LABEL[r]}
          </span>
        ))}
      </div>
    </li>
  )
}
