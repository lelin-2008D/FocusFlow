import { describe, it, expect } from 'vitest'
import {
  computeNextOccurrence,
  computeSnooze,
  isWithinQuietHours,
  isOverdueBeyondThreshold,
} from '../utils/recurrenceUtils'

describe('Recurrence, Snooze, Quiet Hours & Burst Prevention', () => {
  it('computes next occurrence for daily recurrence', () => {
    const base = new Date('2026-10-15T10:00:00.000Z')
    const next = computeNextOccurrence(base, 'daily', '14:00')

    expect(next).toBeDefined()
    expect(next?.toISOString().split('T')[0]).toBe('2026-10-16')
    expect(next?.getHours()).toBe(14)
    expect(next?.getMinutes()).toBe(0)
  })

  it('skips weekends for weekdays recurrence', () => {
    // Friday
    const friday = new Date('2026-10-16T09:00:00.000Z')
    const next = computeNextOccurrence(friday, 'weekdays', '09:00')

    expect(next).toBeDefined()
    // Next day must be Monday, Oct 19
    const dayOfWeek = next?.getDay()
    expect(dayOfWeek).toBe(1) // 1 = Monday
  })

  it('computes next weekly occurrence (+7 days)', () => {
    const wednesday = new Date('2026-10-14T10:00:00.000Z')
    const next = computeNextOccurrence(wednesday, 'weekly')

    expect(next).toBeDefined()
    expect(next?.toISOString().split('T')[0]).toBe('2026-10-21')
  })

  it('computes next monthly occurrence (+1 month)', () => {
    const base = new Date('2026-10-15T10:00:00.000Z')
    const next = computeNextOccurrence(base, 'monthly')

    expect(next).toBeDefined()
    expect(next?.toISOString().split('T')[0]).toBe('2026-11-15')
  })

  it('computes snooze options correctly', () => {
    const base = new Date('2026-10-15T12:00:00.000Z')

    const snooze5 = computeSnooze('5m', base)
    expect(snooze5.getTime() - base.getTime()).toBe(5 * 60 * 1000)

    const snooze15 = computeSnooze('15m', base)
    expect(snooze15.getTime() - base.getTime()).toBe(15 * 60 * 1000)

    const snooze1h = computeSnooze('1h', base)
    expect(snooze1h.getTime() - base.getTime()).toBe(60 * 60 * 1000)

    const snoozeTomorrow = computeSnooze('tomorrow_morning', base)
    expect(snoozeTomorrow.getHours()).toBe(9)
    expect(snoozeTomorrow.getMinutes()).toBe(0)
  })

  it('evaluates quiet hours accurately including overnight windows', () => {
    // 23:30 is within 22:00 - 07:00
    const lateNight = new Date('2026-10-15T23:30:00')
    expect(isWithinQuietHours(lateNight, '22:00', '07:00')).toBe(true)

    // 03:00 is within 22:00 - 07:00
    const earlyMorning = new Date('2026-10-15T03:00:00')
    expect(isWithinQuietHours(earlyMorning, '22:00', '07:00')).toBe(true)

    // 12:00 is outside 22:00 - 07:00
    const noon = new Date('2026-10-15T12:00:00')
    expect(isWithinQuietHours(noon, '22:00', '07:00')).toBe(false)
  })

  it('detects reminders overdue beyond 24h threshold for burst prevention', () => {
    const now = new Date('2026-10-15T12:00:00.000Z')
    const recent = new Date('2026-10-15T10:00:00.000Z') // 2h overdue
    const ancient = new Date('2026-10-13T12:00:00.000Z') // 48h overdue

    expect(isOverdueBeyondThreshold(recent, 24, now)).toBe(false)
    expect(isOverdueBeyondThreshold(ancient, 24, now)).toBe(true)
  })
})
