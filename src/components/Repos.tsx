import { useMemo, useState } from 'react'
import { matchesRepo } from '../lib/filter'
import { formatStars, shortDate } from '../lib/format'
import { ROLE_LABEL, ROLE_ORDER } from '../lib/roles'
import type { Repo, ReposFile, Role } from '../types'

const STALE_DAYS = 120

export function Repos({ data, now, query }: { data: ReposFile | null; now: Date; query: string }) {
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

  return (
    <section aria-labelledby="repos-heading" data-cy="repos">
      <div className="section-head">
        <h2 id="repos-heading">Repos</h2>
        <p className="mono" data-cy="repos-verified">
          {verified} of {data.repos.length} verified on GitHub · {shortDate(data.generatedAt)}
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
      <div className="repo-table-wrap" hidden={repos.length === 0}>
        <table className="repo-table">
          <thead>
            <tr>
              <th scope="col">Repository and why to look</th>
              <th scope="col" className="num">
                Stars
              </th>
              <th scope="col" className="num">
                Last push
              </th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <RepoRow key={repo.fullName} repo={repo} now={now} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mono" style={{ color: 'var(--ink-3)', marginTop: '0.75rem' }}>
        Stars and last push come from the GitHub API at build time. A repo shows “not verified” when that call failed; no number is guessed.
      </p>
    </section>
  )
}

function RepoRow({ repo, now }: { repo: Repo; now: Date }) {
  const stale = repo.lastCommit && now.getTime() - Date.parse(repo.lastCommit) > STALE_DAYS * 86_400_000
  return (
    <tr data-cy="repo-row" data-repo={repo.fullName}>
      <td>
        <a className="repo-name" href={repo.url} target="_blank" rel="noopener noreferrer">
          {repo.fullName}
        </a>
        <p className="repo-why">{repo.why}</p>
        <div className="item__foot" style={{ marginTop: 0 }}>
          {repo.archived && <span className="flag">Archived</span>}
          {stale && <span className="flag">Quiet {STALE_DAYS}+ days</span>}
          {repo.note && <span className="flag">{repo.note}</span>}
          {repo.roles.map((r) => (
            <span key={r} className={`chip role-${r}`}>
              {ROLE_LABEL[r]}
            </span>
          ))}
          {repo.license && <span className="mono" style={{ color: 'var(--ink-3)' }}>{repo.license}</span>}
        </div>
      </td>
      <td className="num mono" data-cy="repo-stars">
        {repo.stars === null ? (
          <span className="unverified">not verified</span>
        ) : (
          <span title={`${repo.stars.toLocaleString('en-US')} stars, verified ${shortDate(repo.verifiedAt!)}`}>≈{formatStars(repo.stars)}</span>
        )}
      </td>
      <td className="num mono">{repo.lastCommit ? shortDate(repo.lastCommit) : <span className="unverified">not verified</span>}</td>
    </tr>
  )
}
