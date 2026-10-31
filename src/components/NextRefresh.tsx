import { useEffect, useState } from 'react'
import { formatCountdown, formatRunTime, isStale, nextRun } from '../lib/schedule'

const ACTIONS_URL = 'https://github.com/Rahaf-Mansour/ai-news-hub/actions'
const NOTE = 'GitHub runs scheduled jobs at about this time; it can be delayed under load.'

/** "Next refresh: Sun, Nov 1 · 7:30 AM your time (in 14h 45m)", or a warning when the data is late. */
export function NextRefresh({ generatedAt }: { generatedAt: string | null }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (generatedAt && isStale(generatedAt, now)) {
    return (
      <span className="run__fail" data-cy="next-refresh" title={NOTE}>
        Last refresh is late —{' '}
        <a href={ACTIONS_URL} target="_blank" rel="noopener noreferrer">
          check the Actions tab
        </a>
      </span>
    )
  }

  const run = nextRun(now)
  return (
    <span data-cy="next-refresh" title={NOTE}>
      Next refresh:{' '}
      <time dateTime={run.toISOString()}>{formatRunTime(run)}</time> your time (in {formatCountdown(run.getTime() - now.getTime())})
    </span>
  )
}
