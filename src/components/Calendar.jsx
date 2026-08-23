import { getMonthGrid, isSameMonth, toDateKey, todayKey, workedMinutes, formatHours } from '../lib/date'
import { colorFor } from '../lib/colors'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ year, month, schedules, categoriesById, selectedDate, onSelectDate, onPrevMonth, onNextMonth, onToday }) {
  const days = getMonthGrid(year, month)
  const today = todayKey()

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-800">
          {year}년 {month + 1}월
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="이전 달"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`py-2 ${i === 0 ? 'text-red-400' : ''} ${i === 6 ? 'text-blue-400' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {days.map((date) => {
          const key = toDateKey(date.getFullYear(), date.getMonth(), date.getDate())
          const inMonth = isSameMonth(date, year, month)
          const dayEntries = schedules[key] || []
          const isToday = key === today
          const isSelected = key === selectedDate
          const dow = date.getDay()

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`flex min-h-20 flex-col items-start gap-1 bg-white p-1.5 text-left transition sm:min-h-24 sm:p-2 ${
                inMonth ? '' : 'bg-slate-50 text-slate-300'
              } ${isSelected ? 'ring-2 ring-inset ring-indigo-500' : 'hover:bg-slate-50'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-indigo-600 text-white' : inMonth ? (dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-slate-700') : ''
                }`}
              >
                {date.getDate()}
              </span>
              {dayEntries.map((shift) => (
                <div
                  key={shift.id}
                  className={`w-full rounded-md px-1 py-0.5 text-[10px] leading-tight sm:text-xs ${colorFor(categoriesById[shift.categoryId]?.color).badge}`}
                >
                  {categoriesById[shift.categoryId] && (
                    <div className="truncate font-semibold">{categoriesById[shift.categoryId].name}</div>
                  )}
                  <div className="font-medium">
                    {shift.startTime}–{shift.endTime}
                  </div>
                  <div className="opacity-80">
                    {formatHours(workedMinutes(shift.startTime, shift.endTime, shift.breakMinutes))}h
                  </div>
                </div>
              ))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
