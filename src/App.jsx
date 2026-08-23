import { useMemo, useState } from 'react'
import Calendar from './components/Calendar'
import ScheduleForm from './components/ScheduleForm'
import { useSchedules } from './lib/useSchedules'
import { workedMinutes, formatHours } from './lib/date'

export default function App() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const { schedules, saveSchedule, deleteSchedule } = useSchedules()

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthlyMinutes = useMemo(() => {
    return Object.values(schedules)
      .filter((s) => s.date.startsWith(monthPrefix))
      .reduce((sum, s) => sum + workedMinutes(s.startTime, s.endTime, s.breakMinutes), 0)
  }, [schedules, monthPrefix])

  function goPrevMonth() {
    const d = new Date(year, month - 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function goNextMonth() {
    const d = new Date(year, month + 1, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  function handleSave(entry) {
    saveSchedule(entry)
  }

  function handleDelete(date) {
    deleteSchedule(date)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800">알바 근무 스케줄러</h1>
          <div className="text-sm text-slate-500">
            이번 달 근무시간 <span className="font-semibold text-indigo-600">{formatHours(monthlyMinutes)}시간</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-[2fr_1fr]">
        <Calendar
          year={year}
          month={month}
          schedules={schedules}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onToday={goToday}
        />
        <ScheduleForm
          key={selectedDate}
          date={selectedDate}
          existing={selectedDate ? schedules[selectedDate] : null}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}
