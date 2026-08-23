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

// Schedules are keyed by date ("YYYY-MM-DD") -> { date, startTime, endTime, breakMinutes }
export function useSchedules() {
  const [schedules, setSchedules] = useState(loadSchedules)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  }, [schedules])

  function saveSchedule({ date, startTime, endTime, breakMinutes }) {
    setSchedules((prev) => ({
      ...prev,
      [date]: { date, startTime, endTime, breakMinutes: Number(breakMinutes) || 0 },
    }))
  }

  function deleteSchedule(date) {
    setSchedules((prev) => {
      const next = { ...prev }
      delete next[date]
      return next
    })
  }

  return { schedules, saveSchedule, deleteSchedule }
}
