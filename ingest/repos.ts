import type { Repo, RepoConfig } from '../src/types'

interface GitHubRepoResponse {
  stargazers_count?: number
  pushed_at?: string
  archived?: boolean
  html_url?: string
  license?: { spdx_id?: string | null } | null
}

export type JsonFetcher = (url: string, headers: Record<string, string>) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>

/**
 * Read stars, last push, license and archived state from the GitHub REST API.
 * When a call fails (rate limit, outage), the repo keeps its last verified
 * numbers with their original verifiedAt date, so the site can say when they
 * were checked. A repo that was never verified gets nulls: "not verified",
 * never a guessed number.
 */
export async function fetchRepos(
  configs: RepoConfig[],
  now: Date,
  token = process.env.GITHUB_TOKEN,
  fetchJson: JsonFetcher = (url, headers) => fetch(url, { headers }),
  previous: Repo[] = [],
): Promise<{ repos: Repo[]; failures: string[] }> {
  const lastVerified = new Map(previous.filter((r) => r.verifiedAt && r.stars !== null).map((r) => [r.fullName, r]))
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'ai-news-hub',
    'x-github-api-version': '2022-11-28',
  }
  if (token) headers.authorization = `Bearer ${token}`

  const failures: string[] = []
  const repos = await Promise.all(
    configs.map(async (config): Promise<Repo> => {
      const fallback: Repo = {
        ...config,
        url: `https://github.com/${config.fullName}`,
        stars: null,
        lastCommit: null,
        archived: null,
        license: null,
        verifiedAt: null,
      }
      try {
        const res = await fetchJson(`https://api.github.com/repos/${config.fullName}`, headers)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as GitHubRepoResponse
        if (typeof data.stargazers_count !== 'number') throw new Error('response had no star count')
        const spdx = data.license?.spdx_id
        return {
          ...fallback,
          url: data.html_url ?? fallback.url,
          stars: data.stargazers_count,
          lastCommit: data.pushed_at ?? null,
          archived: data.archived ?? null,
          license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
          verifiedAt: now.toISOString(),
        }
      } catch (err) {
        failures.push(`${config.fullName}: ${(err as Error).message}`)
        const last = lastVerified.get(config.fullName)
        return last
          ? { ...fallback, url: last.url, stars: last.stars, lastCommit: last.lastCommit, archived: last.archived, license: last.license, verifiedAt: last.verifiedAt }
          : fallback
      }
    }),
  )
  return { repos, failures }
}
