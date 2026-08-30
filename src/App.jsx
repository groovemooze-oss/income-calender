import { useMemo, useState } from 'react'
import Calendar from './components/Calendar'
import ScheduleForm from './components/ScheduleForm'
import CategorySummary from './components/CategorySummary'
import RepeatScheduleModal from './components/RepeatScheduleModal'
import AuthButton from './components/AuthButton'
import { useSchedules, allEntries } from './lib/useSchedules'
import { useCategories } from './lib/useCategories'
import { useAuth } from './lib/useAuth'
import { workedMinutes, formatHours } from './lib/date'
import { calculateNetPay, formatWon } from './lib/pay'

export default function App() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showRepeatModal, setShowRepeatModal] = useState(false)
  const { user, authLoading, firebaseEnabled, signInWithGoogle, signOutUser } = useAuth()
  const uid = user?.uid ?? null
  const { schedules, addSchedule, updateSchedule, deleteSchedule, deleteScheduleSeries, deleteScheduleSeriesFrom, clearCategory } =
    useSchedules(uid)
  const { categories, addCategory, removeCategory, updateCategory, setCategoryNoBreak } = useCategories(uid)

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
        return sum + calculateNetPay(workedMinutes(s.startTime, s.endTime, s.breakMinutes), category)
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-purple-100">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-400/50 blur-3xl" />
        <div className="absolute -right-10 top-1/4 h-[28rem] w-[28rem] rounded-full bg-purple-400/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-sky-400/45 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 border-b border-white/40 bg-white/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xl font-extrabold tracking-wide text-transparent">
            INCOME CALENDAR
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRepeatModal(true)}
              className="rounded-lg border border-white/60 bg-white/40 px-3 py-1.5 text-sm text-slate-600 backdrop-blur-sm hover:bg-white/60"
            >
              반복 일정 등록
            </button>
            <div className="text-sm text-slate-500">
              이번 달 근무시간 <span className="font-semibold text-indigo-600">{formatHours(monthlyMinutes)}시간</span>
              {monthlyPay > 0 && (
                <>
                  {' · 예상 급여 '}
                  <span className="font-semibold text-indigo-600">{formatWon(monthlyPay)}</span>
                </>
              )}
            </div>
            <AuthButton
              firebaseEnabled={firebaseEnabled}
              authLoading={authLoading}
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={signOutUser}
            />
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-[2fr_1fr]">
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
          onDeleteSeries={deleteScheduleSeries}
          onDeleteSeriesFrom={deleteScheduleSeriesFrom}
          onAddCategory={addCategory}
          onSetCategoryNoBreak={setCategoryNoBreak}
        />
      </main>

      {showRepeatModal && (
        <RepeatScheduleModal categories={categories} onAdd={addSchedule} onClose={() => setShowRepeatModal(false)} />
      )}
    </div>
  )
}
