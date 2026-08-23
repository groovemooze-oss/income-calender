import { useEffect, useState } from 'react'

const STORAGE_KEY = 'workSchedules'

function loadSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function makeId() {
  return `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Schedules are keyed by date ("YYYY-MM-DD") -> array of entries, since a
// day can have shifts at more than one workplace:
// { id, date, startTime, endTime, breakMinutes, categoryId, noBreak }
export function useSchedules() {
  const [schedules, setSchedules] = useState(loadSchedules)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  }, [schedules])

  function addSchedule({ date, startTime, endTime, breakMinutes, categoryId, noBreak }) {
    const entry = {
      id: makeId(),
      date,
      startTime,
      endTime,
      breakMinutes: noBreak ? 0 : Number(breakMinutes) || 0,
      categoryId: categoryId || null,
      noBreak: !!noBreak,
    }
    setSchedules((prev) => ({ ...prev, [date]: [...(prev[date] || []), entry] }))
    return entry
  }

  function updateSchedule(date, id, { startTime, endTime, breakMinutes, categoryId, noBreak }) {
    setSchedules((prev) => ({
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
    setSchedules((prev) => {
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

  // Detach a deleted category from any schedules that still reference it.
  function clearCategory(categoryId) {
    setSchedules((prev) => {
      const next = {}
      for (const [date, entries] of Object.entries(prev)) {
        next[date] = entries.map((e) => (e.categoryId === categoryId ? { ...e, categoryId: null } : e))
      }
      return next
    })
  }

  return { schedules, addSchedule, updateSchedule, deleteSchedule, clearCategory }
}

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
