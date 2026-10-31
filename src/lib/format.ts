const DAY = 86_400_000

/** "2h ago", "Yesterday", "Mon", "Oct 28", "Oct 28, 2025". */
export function relativeDate(iso: string, now: Date): string {
  const then = new Date(iso)
  const diff = now.getTime() - then.getTime()
  if (diff < 60 * 60_000) return `${Math.max(1, Math.round(diff / 60_000))}m ago`
  if (diff < 12 * 3_600_000) return `${Math.round(diff / 3_600_000)}h ago`
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (then.getTime() >= startOfToday) return 'Today'
  if (then.getTime() >= startOfToday - DAY) return 'Yesterday'
  if (diff < 6 * DAY) return then.toLocaleDateString('en-US', { weekday: 'short' })
  const sameYear = then.getFullYear() === now.getFullYear()
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** 154027 → "154k", 9727 → "9.7k", 167 → "167". */
export function formatStars(n: number): string {
  if (n >= 100_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}
