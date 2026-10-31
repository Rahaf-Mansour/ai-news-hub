const USER_AGENT = 'ai-news-hub/0.1 (personal daily digest; +https://github.com/)'

export interface FetchOptions {
  timeoutMs?: number
  headers?: Record<string, string>
}

/** GET a URL as text. Throws on timeout or a non-2xx status so the caller can log and skip. */
export async function fetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20_000)
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, ...opts.headers },
      signal: controller.signal,
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return await res.text()
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error(`Timed out after ${opts.timeoutMs ?? 20_000} ms: ${url}`)
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export type TextFetcher = (url: string, opts?: FetchOptions) => Promise<string>
