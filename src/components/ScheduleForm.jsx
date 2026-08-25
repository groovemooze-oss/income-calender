import { useState } from 'react'
import { workedMinutes, formatHours } from '../lib/date'
import { findLatestByCategory } from '../lib/useSchedules'
import { calculatePay, calculateNetPay, formatWon } from '../lib/pay'
import { colorFor } from '../lib/colors'

const EMPTY_FORM = { startTime: '09:00', endTime: '18:00', breakMinutes: 60, categoryId: '', noBreak: false }

// Parent remounts this component (via key={date}) whenever the selected
// date changes, so local state can start fresh for each day.
export default function ScheduleForm({
  date,
  dayEntries,
  categories,
  schedules,
  onAdd,
  onUpdate,
  onDelete,
  onAddCategory,
  onSetCategoryNoBreak,
}) {
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryWage, setNewCategoryWage] = useState('')
  const [newCategoryTax33, setNewCategoryTax33] = useState(false)
  const [newCategoryTaxInsurance, setNewCategoryTaxInsurance] = useState(false)
  const [newCategoryIncludesHolidayPay, setNewCategoryIncludesHolidayPay] = useState(false)

  if (!date) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-200">
        캘린더에서 날짜를 선택해 근무시간을 등록하세요.
      </div>
    )
  }

  const minutes = workedMinutes(form.startTime, form.endTime, form.breakMinutes)
  const selectedCategory = categories.find((c) => c.id === form.categoryId)
  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

  function resetToNewEntry() {
    setEditingEntryId(null)
    setForm(EMPTY_FORM)
  }

  function startEditingEntry(entry) {
    setEditingEntryId(entry.id)
    setForm({
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      categoryId: entry.categoryId ?? '',
      noBreak: entry.noBreak ?? false,
    })
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Selecting a workplace prefills that workplace's most recent shift times
  // (still editable), and applies its remembered "no break" preference.
  function handleCategoryChange(e) {
    const categoryId = e.target.value
    const category = categories.find((c) => c.id === categoryId)
    const noBreak = category ? category.noBreak : form.noBreak
    const previous = findLatestByCategory(schedules, categoryId, editingEntryId)
    setForm((prev) => {
      const next = { ...prev, categoryId, noBreak }
      if (previous) {
        next.startTime = previous.startTime
        next.endTime = previous.endTime
        next.breakMinutes = noBreak ? 0 : previous.breakMinutes
      } else if (noBreak) {
        next.breakMinutes = 0
      }
      return next
    })
  }

  // The checkbox both sets this entry's break to 0 and remembers the
  // preference on the workplace, so future entries there default to it too.
  function handleNoBreakToggle() {
    const noBreak = !form.noBreak
    setForm((prev) => ({ ...prev, noBreak, breakMinutes: noBreak ? 0 : prev.breakMinutes }))
    if (form.categoryId) onSetCategoryNoBreak(form.categoryId, noBreak)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editingEntryId) {
      onUpdate(date, editingEntryId, form)
    } else {
      onAdd({ date, ...form })
    }
    resetToNewEntry()
  }

  function handleDeleteEntry(id) {
    onDelete(date, id)
    if (editingEntryId === id) resetToNewEntry()
  }

  function handleAddCategory() {
    const created = onAddCategory(
      newCategoryName,
      newCategoryWage,
      newCategoryTax33,
      newCategoryTaxInsurance,
      newCategoryIncludesHolidayPay,
    )
    if (created) {
      setForm((prev) => ({ ...prev, categoryId: created.id, noBreak: false }))
      setNewCategoryName('')
      setNewCategoryWage('')
      setNewCategoryTax33(false)
      setNewCategoryTaxInsurance(false)
      setNewCategoryIncludesHolidayPay(false)
      setShowNewCategory(false)
    }
  }

  function handleCancelNewCategory() {
    setNewCategoryName('')
    setNewCategoryWage('')
    setNewCategoryTax33(false)
    setNewCategoryTaxInsurance(false)
    setNewCategoryIncludesHolidayPay(false)
    setShowNewCategory(false)
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{date}</h3>
        <p className="text-xs text-slate-400">하루에 여러 근무처의 기록을 추가할 수 있습니다.</p>
      </div>

      {dayEntries.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {dayEntries.map((entry) => {
            const category = categoriesById[entry.categoryId]
            const isActive = editingEntryId === entry.id
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                  isActive ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100'
                }`}
              >
                {category && <span className={`h-2 w-2 shrink-0 rounded-full ${colorFor(category.color).dot}`} />}
                <button
                  type="button"
                  onClick={() => startEditingEntry(entry)}
                  className="min-w-0 flex-1 truncate text-left text-slate-700 hover:underline"
                >
                  {category ? `${category.name} · ` : ''}
                  {entry.startTime}–{entry.endTime}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="shrink-0 text-slate-400 hover:text-red-500"
                >
                  삭제
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            {editingEntryId ? '기록 수정' : '새 기록 추가'}
          </span>
          {editingEntryId && (
            <button type="button" onClick={resetToNewEntry} className="text-xs text-indigo-600 hover:underline">
              새 기록으로 전환
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>근무처</span>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              title="새 근무처 추가"
            >
              +
            </button>
          </div>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleCategoryChange}
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
        </div>

        {showNewCategory && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="새 근무처 이름"
                autoFocus
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="number"
                min="0"
                step="10"
                value={newCategoryWage}
                onChange={(e) => setNewCategoryWage(e.target.value)}
                placeholder="시급"
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newCategoryTax33}
                  onChange={(e) => setNewCategoryTax33(e.target.checked)}
                  className="accent-indigo-600"
                />
                3.3% 원천징수
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={newCategoryTaxInsurance}
                  onChange={(e) => setNewCategoryTaxInsurance(e.target.checked)}
                  className="accent-indigo-600"
                />
                사대보험
              </label>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={newCategoryIncludesHolidayPay}
                onChange={(e) => setNewCategoryIncludesHolidayPay(e.target.checked)}
                className="accent-indigo-600"
              />
              시급에 주휴수당 포함됨 (별도 계산 안 함)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                추가
              </button>
              <button
                type="button"
                onClick={handleCancelNewCategory}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
              >
                취소
              </button>
            </div>
          </div>
        )}

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
          실 근무시간: <span className="font-semibold text-indigo-600">{formatHours(minutes)}시간</span>
          {selectedCategory && selectedCategory.hourlyWage > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-indigo-600">{formatWon(calculateNetPay(minutes, selectedCategory))}</span>
              {(selectedCategory.tax3_3 || selectedCategory.taxInsurance) && (
                <span className="text-xs text-slate-400"> (세전 {formatWon(calculatePay(minutes, selectedCategory.hourlyWage))})</span>
              )}
            </>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {editingEntryId ? '수정 저장' : '추가'}
          </button>
        </div>
      </form>
    </div>
  )
}
