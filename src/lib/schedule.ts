/**
 * When the daily GitHub Actions job runs. Keep in sync with the cron in
 * .github/workflows/daily.yml ('30 5 * * *').
 */
export const DAILY_RUN_UTC = { hour: 5, minute: 30 } as const

/** Data older than this means a scheduled run was missed or failed. */
export const STALE_AFTER_HOURS = 30

/** The next scheduled run strictly after `now`. */
export function nextRun(now: Date): Date {
  const run = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RUN_UTC.hour, DAILY_RUN_UTC.minute))
  if (run.getTime() <= now.getTime()) run.setUTCDate(run.getUTCDate() + 1)
  return run
}

/** "14h 45m", "45m", "under a minute". */
export function formatCountdown(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'under a minute'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

/** The run time in the viewer's own time zone, e.g. "Sun, Nov 1 · 7:30 AM". */
export function formatRunTime(run: Date, timeZone?: string): string {
  const day = run.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone })
  const time = run.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
  return `${day} · ${time}`
}

export function isStale(generatedAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(generatedAt) > STALE_AFTER_HOURS * 3_600_000
}
