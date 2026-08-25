import { useState } from 'react'
import { datesInRange, todayKey } from '../lib/date'
import { formatWon } from '../lib/pay'
import TimeSelect from './TimeSelect'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function RepeatScheduleModal({ categories, onAdd, onClose }) {
  const today = todayKey()
  const [form, setForm] = useState({
    categoryId: '',
    weekdays: [1, 2, 3, 4, 5],
    startDate: today,
    endDate: today,
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    noBreak: false,
  })

  const rangeValid = form.startDate && form.endDate && form.startDate <= form.endDate
  const matchedDates = rangeValid ? datesInRange(form.startDate, form.endDate, form.weekdays) : []

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function toggleWeekday(day) {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort(),
    }))
  }

  function handleNoBreakToggle() {
    setForm((prev) => ({ ...prev, noBreak: !prev.noBreak }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (matchedDates.length === 0) return
    matchedDates.forEach((date) => {
      onAdd({
        date,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: form.noBreak ? 0 : form.breakMinutes,
        categoryId: form.categoryId,
        noBreak: form.noBreak,
      })
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">반복 일정 등록</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
            닫기
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          근무처
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">미지정</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.hourlyWage > 0 ? ` · 시급 ${formatWon(c.hourlyWage)}` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <span>반복 요일</span>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`h-8 w-8 rounded-full text-sm font-medium ${
                  form.weekdays.includes(day)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            시작일
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            종료일
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              min={form.startDate}
              onChange={handleChange}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            출근 시간
            <TimeSelect name="startTime" value={form.startTime} onChange={handleChange} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            퇴근 시간
            <TimeSelect name="endTime" value={form.endTime} onChange={handleChange} />
          </label>
        </div>

        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>휴게시간 (분)</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input type="checkbox" checked={form.noBreak} onChange={handleNoBreakToggle} className="accent-indigo-600" />
              휴게시간 없음
            </label>
          </div>
          <input
            type="number"
            name="breakMinutes"
            min="0"
            step="5"
            value={form.breakMinutes}
            onChange={handleChange}
            disabled={form.noBreak}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {form.weekdays.length === 0 ? (
            <span className="text-red-500">반복 요일을 하나 이상 선택하세요.</span>
          ) : !rangeValid ? (
            <span className="text-red-500">종료일은 시작일 이후여야 합니다.</span>
          ) : (
            <>
              총 <span className="font-semibold text-indigo-600">{matchedDates.length}일</span>에 등록됩니다.
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={matchedDates.length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {matchedDates.length > 0 ? `${matchedDates.length}일 일괄 등록` : '일괄 등록'}
        </button>
      </form>
    </div>
  )
}
