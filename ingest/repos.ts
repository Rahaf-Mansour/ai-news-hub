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
 * A repo whose call fails gets nulls and no verifiedAt, so the site shows
 * "not verified" instead of a stale or guessed number.
 */
export async function fetchRepos(
  configs: RepoConfig[],
  now: Date,
  token = process.env.GITHUB_TOKEN,
  fetchJson: JsonFetcher = (url, headers) => fetch(url, { headers }),
): Promise<{ repos: Repo[]; failures: string[] }> {
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
        return fallback
      }
    }),
  )
  return { repos, failures }
}
