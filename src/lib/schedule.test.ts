import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DAILY_RUN_UTC, formatCountdown, formatRunTime, isStale, nextRun } from './schedule'

describe('nextRun', () => {
  it('is later the same UTC day before 05:30', () => {
    expect(nextRun(new Date('2026-10-31T04:00:00Z')).toISOString()).toBe('2026-10-31T05:30:00.000Z')
  })
  it('is the next day after 05:30, and strictly after "now" at exactly 05:30', () => {
    expect(nextRun(new Date('2026-10-31T14:45:00Z')).toISOString()).toBe('2026-11-01T05:30:00.000Z')
    expect(nextRun(new Date('2026-10-31T05:30:00Z')).toISOString()).toBe('2026-11-01T05:30:00.000Z')
  })
  it('rolls over month and year boundaries', () => {
    expect(nextRun(new Date('2026-11-30T23:59:00Z')).toISOString()).toBe('2026-12-01T05:30:00.000Z')
    expect(nextRun(new Date('2026-12-31T06:00:00Z')).toISOString()).toBe('2027-01-01T05:30:00.000Z')
    expect(nextRun(new Date('2028-02-28T10:00:00Z')).toISOString()).toBe('2028-02-29T05:30:00.000Z')
  })
  it('matches the cron in the workflow', () => {
    const yml = readFileSync(new URL('../../.github/workflows/daily.yml', import.meta.url), 'utf8')
    expect(yml).toContain(`cron: '${DAILY_RUN_UTC.minute} ${DAILY_RUN_UTC.hour} * * *'`)
  })
})

describe('formatting', () => {
  it('formats the countdown', () => {
    expect(formatCountdown((14 * 60 + 45) * 60_000)).toBe('14h 45m')
    expect(formatCountdown(45 * 60_000 + 30_000)).toBe('45m')
    expect(formatCountdown(20_000)).toBe('under a minute')
  })
  it('formats the run time in a given time zone', () => {
    expect(formatRunTime(new Date('2026-11-01T05:30:00Z'), 'Asia/Jerusalem')).toBe('Sun, Nov 1 · 7:30 AM')
    expect(formatRunTime(new Date('2026-11-01T05:30:00Z'), 'UTC')).toBe('Sun, Nov 1 · 5:30 AM')
  })
  it('flags data older than 30 hours as stale', () => {
    expect(isStale('2026-10-31T05:30:00Z', new Date('2026-11-01T10:00:00Z'))).toBe(false)
    expect(isStale('2026-10-30T05:30:00Z', new Date('2026-11-01T10:00:00Z'))).toBe(true)
  })
})
