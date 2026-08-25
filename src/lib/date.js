export function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function todayKey() {
  const d = new Date()
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

// Returns a 6x7 grid of Date objects covering the month view (including
// leading/trailing days from adjacent months), Sunday-first.
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function isSameMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month
}

// Work duration in minutes, handling overnight shifts (end <= start).
export function workedMinutes(startTime, endTime, breakMinutes = 0) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes <= 0) minutes += 24 * 60
  return Math.max(0, minutes - Number(breakMinutes || 0))
}

export function formatHours(minutes) {
  return (minutes / 60).toFixed(1)
}

// The Sunday-start date key of the week containing `dateStr` — used to
// group shifts into weeks for weekly-holiday-pay calculations.
export function weekKeyFor(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - date.getDay())
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate())
}

// "8/3 ~ 8/9" label for a week identified by its Sunday weekKey.
export function weekRangeLabel(weekKey) {
  const [y, m, d] = weekKey.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + 6)
  const fmt = (date) => `${date.getMonth() + 1}/${date.getDate()}`
  return `${fmt(start)} ~ ${fmt(end)}`
}

// All date keys in [startDateStr, endDateStr] whose day-of-week (0=Sun)
// is in `weekdays` — used to expand a recurring schedule into entries.
export function datesInRange(startDateStr, endDateStr, weekdays) {
  const [sy, sm, sd] = startDateStr.split('-').map(Number)
  const [ey, em, ed] = endDateStr.split('-').map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const dates = []
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(toDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}
