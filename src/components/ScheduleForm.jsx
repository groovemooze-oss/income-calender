import { useState } from 'react'
import { workedMinutes, formatHours } from '../lib/date'

const EMPTY = { startTime: '09:00', endTime: '18:00', breakMinutes: 60 }

// Parent remounts this component (via key={date}) whenever the selected
// date changes, so form state can be initialized once from `existing`.
export default function ScheduleForm({ date, existing, onSave, onDelete }) {
  const [form, setForm] = useState(existing ?? EMPTY)

  if (!date) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-200">
        캘린더에서 날짜를 선택해 근무시간을 등록하세요.
      </div>
    )
  }

  const minutes = workedMinutes(form.startTime, form.endTime, form.breakMinutes)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ date, ...form })
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{date}</h3>
        <p className="text-xs text-slate-400">근무 시작/종료 시간과 휴게시간을 입력하세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          출근 시간
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          퇴근 시간
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        휴게시간 (분)
        <input
          type="number"
          name="breakMinutes"
          min="0"
          step="5"
          value={form.breakMinutes}
          onChange={handleChange}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        실 근무시간: <span className="font-semibold text-indigo-600">{formatHours(minutes)}시간</span>
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          저장
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => onDelete(date)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  )
}
