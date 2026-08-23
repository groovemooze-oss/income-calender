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
