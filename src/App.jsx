import { useMemo, useState } from 'react'
import Calendar from './components/Calendar'
import ScheduleForm from './components/ScheduleForm'
import CategorySummary from './components/CategorySummary'
import { useSchedules, allEntries } from './lib/useSchedules'
import { useCategories } from './lib/useCategories'
import { workedMinutes, formatHours } from './lib/date'
import { calculatePay, formatWon } from './lib/pay'

export default function App() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const { schedules, addSchedule, updateSchedule, deleteSchedule, clearCategory } = useSchedules()
  const { categories, addCategory, removeCategory, updateCategory, setCategoryNoBreak } = useCategories()

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthlySchedules = useMemo(
    () => allEntries(schedules).filter((s) => s.date.startsWith(monthPrefix)),
    [schedules, monthPrefix],
  )
  const monthlyMinutes = useMemo(
    () => monthlySchedules.reduce((sum, s) => sum + workedMinutes(s.startTime, s.endTime, s.breakMinutes), 0),
    [monthlySchedules],
  )
  const monthlyPay = useMemo(
    () =>
      monthlySchedules.reduce((sum, s) => {
        const category = categoriesById[s.categoryId]
        if (!category) return sum
        return sum + calculatePay(workedMinutes(s.startTime, s.endTime, s.breakMinutes), category.hourlyWage)
      }, 0),
    [monthlySchedules, categoriesById],
  )

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

  function handleRemoveCategory(id) {
    removeCategory(id)
    clearCategory(id)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800">알바 근무 스케줄러</h1>
          <div className="text-sm text-slate-500">
            이번 달 근무시간 <span className="font-semibold text-indigo-600">{formatHours(monthlyMinutes)}시간</span>
            {monthlyPay > 0 && (
              <>
                {' · 예상 급여 '}
                <span className="font-semibold text-indigo-600">{formatWon(monthlyPay)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Calendar
            year={year}
            month={month}
            schedules={schedules}
            categoriesById={categoriesById}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onToday={goToday}
          />
          <CategorySummary
            categories={categories}
            schedules={schedules}
            onRemoveCategory={handleRemoveCategory}
            onUpdateCategory={updateCategory}
          />
        </div>
        <ScheduleForm
          key={selectedDate}
          date={selectedDate}
          dayEntries={selectedDate ? schedules[selectedDate] || [] : []}
          categories={categories}
          schedules={schedules}
          onAdd={addSchedule}
          onUpdate={updateSchedule}
          onDelete={deleteSchedule}
          onAddCategory={addCategory}
          onSetCategoryNoBreak={setCategoryNoBreak}
        />
      </main>
    </div>
  )
}
