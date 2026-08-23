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
