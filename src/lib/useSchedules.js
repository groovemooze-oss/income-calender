import { useEffect, useState } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { createSerializedWriter } from './firestoreSync'

const STORAGE_KEY = 'workSchedules'

function makeId() {
  return `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Set on every entry created via RepeatScheduleModal's batch — entries from
// the same submission share one id, so they can later be deleted together
// ("이후 일정 삭제" / "전체 일정 삭제") without touching other schedules.
function makeRecurringId() {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isValidEntryShape(entry) {
  return !!entry && typeof entry.startTime === 'string' && typeof entry.endTime === 'string'
}

function normalizeEntry(date, entry) {
  return {
    id: typeof entry.id === 'string' ? entry.id : makeId(),
    date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    breakMinutes: Number(entry.breakMinutes) || 0,
    categoryId: entry.categoryId || null,
    noBreak: !!entry.noBreak,
    recurringId: entry.recurringId || null,
  }
}

// Groups an entry into a "series" for the bulk-delete options. Entries
// created via RepeatScheduleModal after recurringId was introduced use it
// directly (precise: only that exact batch matches). Older entries — and
// any two manually-added entries that just happen to share a workplace and
// time — have no recurringId, so they fall back to a signature of their
// shape; anything else with that same signature is treated as the same
// series. This is what makes "이후 일정 삭제" / "전체 일정 삭제" work on
// schedules created before recurringId existed, without a data migration.
function seriesKeyOf(entry) {
  if (entry.recurringId) return `id:${entry.recurringId}`
  return `sig:${entry.categoryId}|${entry.startTime}|${entry.endTime}|${entry.breakMinutes}|${entry.noBreak}`
}

// Migrates older storage shapes into the current one: { date: entry[] }.
// Earlier versions stored one entry object per date (no array); those get
// wrapped. Anything unrecognized is dropped rather than left to crash
// rendering downstream.
function normalizeSchedules(parsed) {
  const next = {}
  for (const [date, value] of Object.entries(parsed || {})) {
    if (Array.isArray(value)) {
      const entries = value.filter(isValidEntryShape).map((entry) => normalizeEntry(date, entry))
      if (entries.length > 0) next[date] = entries
    } else if (isValidEntryShape(value)) {
      next[date] = [normalizeEntry(date, value)]
    }
  }
  return next
}

function loadLocalSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalizeSchedules(raw ? JSON.parse(raw) : {})
  } catch {
    return {}
  }
}

// Schedules are keyed by date ("YYYY-MM-DD") -> array of entries, since a
// day can have shifts at more than one workplace:
// { id, date, startTime, endTime, breakMinutes, categoryId, noBreak }
//
// With no `uid` (guest mode), schedules live in localStorage only. Signed
// in, they live in Firestore at users/{uid}.schedules instead: the local
// copy on first sign-in is migrated up if the cloud doc has none yet, then
// onSnapshot keeps this device and any other signed-in device in sync.
export function useSchedules(uid) {
  const [schedules, setSchedules] = useState(uid ? {} : loadLocalSchedules)
  const [writeToFirestore] = useState(() => createSerializedWriter())

  useEffect(() => {
    if (!uid) {
      setSchedules(loadLocalSchedules())
      return
    }
    const ref = doc(db, 'users', uid)
    let cancelled = false
    getDoc(ref).then((snap) => {
      if (cancelled || snap.data()?.schedules !== undefined) return
      writeToFirestore(uid, 'schedules', loadLocalSchedules())
    })
    const unsubscribe = onSnapshot(ref, (snap) => {
      const cloudSchedules = snap.data()?.schedules
      if (cloudSchedules !== undefined) setSchedules(normalizeSchedules(cloudSchedules))
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [uid, writeToFirestore])

  useEffect(() => {
    if (uid) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  }, [schedules, uid])

  // Applies a local update immediately, and mirrors it to Firestore when
  // signed in (onSnapshot above will echo the same value back). Takes an
  // updater (not a plain value) so callers made in the same synchronous
  // batch — e.g. RepeatScheduleModal adding several dates in a row — each
  // see the previous call's result rather than a stale closure value.
  function commit(updater) {
    setSchedules((prev) => {
      const next = updater(prev)
      if (uid) writeToFirestore(uid, 'schedules', next)
      return next
    })
  }

  function addSchedule({ date, startTime, endTime, breakMinutes, categoryId, noBreak, recurringId }) {
    const entry = {
      id: makeId(),
      date,
      startTime,
      endTime,
      breakMinutes: noBreak ? 0 : Number(breakMinutes) || 0,
      categoryId: categoryId || null,
      noBreak: !!noBreak,
      recurringId: recurringId || null,
    }
    commit((prev) => ({ ...prev, [date]: [...(prev[date] || []), entry] }))
    return entry
  }

  function updateSchedule(date, id, { startTime, endTime, breakMinutes, categoryId, noBreak }) {
    commit((prev) => ({
      ...prev,
      [date]: (prev[date] || []).map((e) =>
        e.id === id
          ? {
              ...e,
              startTime,
              endTime,
              breakMinutes: noBreak ? 0 : Number(breakMinutes) || 0,
              categoryId: categoryId || null,
              noBreak: !!noBreak,
            }
          : e,
      ),
    }))
  }

  function deleteSchedule(date, id) {
    commit((prev) => {
      const remaining = (prev[date] || []).filter((e) => e.id !== id)
      const next = { ...prev }
      if (remaining.length > 0) {
        next[date] = remaining
      } else {
        delete next[date]
      }
      return next
    })
  }

  // Removes every entry in the given series (see seriesKeyOf), past or future.
  function deleteScheduleSeries(seriesKey) {
    commit((prev) => {
      const next = {}
      for (const [date, entries] of Object.entries(prev)) {
        const remaining = entries.filter((e) => seriesKeyOf(e) !== seriesKey)
        if (remaining.length > 0) next[date] = remaining
      }
      return next
    })
  }

  // Removes entries in the given series dated on/after fromDate, leaving
  // earlier occurrences (and everything outside the series) intact.
  function deleteScheduleSeriesFrom(seriesKey, fromDate) {
    commit((prev) => {
      const next = {}
      for (const [date, entries] of Object.entries(prev)) {
        const remaining = entries.filter((e) => !(seriesKeyOf(e) === seriesKey && date >= fromDate))
        if (remaining.length > 0) next[date] = remaining
      }
      return next
    })
  }

  // Detach a deleted category from any schedules that still reference it.
  function clearCategory(categoryId) {
    commit((prev) => {
      const next = {}
      for (const [date, entries] of Object.entries(prev)) {
        next[date] = entries.map((e) => (e.categoryId === categoryId ? { ...e, categoryId: null } : e))
      }
      return next
    })
  }

  return {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    deleteScheduleSeries,
    deleteScheduleSeriesFrom,
    clearCategory,
  }
}

export { makeRecurringId, seriesKeyOf }

// Flattens the { date: entry[] } map into a single list of entries.
export function allEntries(schedules) {
  return Object.values(schedules).flat()
}

// Most recent schedule at the same category, excluding `excludeId` (the
// entry currently being edited) — used to prefill a new entry's times.
export function findLatestByCategory(schedules, categoryId, excludeId) {
  if (!categoryId) return null
  let latest = null
  for (const entry of allEntries(schedules)) {
    if (entry.categoryId !== categoryId || entry.id === excludeId) continue
    if (!latest || entry.date > latest.date) latest = entry
  }
  return latest
}
