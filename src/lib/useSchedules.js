import { useEffect, useState } from 'react'

const STORAGE_KEY = 'workSchedules'

function loadSchedules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    // Defensively drop anything that isn't a well-formed single entry, in
    // case a previous, incompatible schema (e.g. one entry stored as an
    // array) is still sitting in this browser's storage.
    const next = {}
    for (const [date, entry] of Object.entries(parsed)) {
      if (entry && typeof entry.startTime === 'string' && typeof entry.endTime === 'string') {
        next[date] = entry
      }
    }
    return next
  } catch {
    return {}
  }
}

// Schedules are keyed by date ("YYYY-MM-DD") -> { date, startTime, endTime, breakMinutes, categoryId }
export function useSchedules() {
  const [schedules, setSchedules] = useState(loadSchedules)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  }, [schedules])

  function saveSchedule({ date, startTime, endTime, breakMinutes, categoryId }) {
    setSchedules((prev) => ({
      ...prev,
      [date]: { date, startTime, endTime, breakMinutes: Number(breakMinutes) || 0, categoryId: categoryId || null },
    }))
  }

  function deleteSchedule(date) {
    setSchedules((prev) => {
      const next = { ...prev }
      delete next[date]
      return next
    })
  }

  // Detach a deleted category from any schedules that still reference it.
  function clearCategory(categoryId) {
    setSchedules((prev) => {
      const next = {}
      for (const [date, entry] of Object.entries(prev)) {
        next[date] = entry.categoryId === categoryId ? { ...entry, categoryId: null } : entry
      }
      return next
    })
  }

  return { schedules, saveSchedule, deleteSchedule, clearCategory }
}

// Most recent schedule at the same category, excluding `excludeDate` (the
// entry currently being edited) — used to prefill a new entry's times.
export function findLatestByCategory(schedules, categoryId, excludeDate) {
  if (!categoryId) return null
  let latest = null
  for (const entry of Object.values(schedules)) {
    if (entry.categoryId !== categoryId || entry.date === excludeDate) continue
    if (!latest || entry.date > latest.date) latest = entry
  }
  return latest
}
