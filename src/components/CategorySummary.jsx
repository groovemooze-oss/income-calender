import { useState } from 'react'
import { workedMinutes, formatHours } from '../lib/date'
import { colorFor } from '../lib/colors'
import { calculatePay, formatWon } from '../lib/pay'
import { allEntries } from '../lib/useSchedules'

// For each category, records are listed in date order and, starting from
// the 2nd record, annotated with the running cumulative hours (and pay,
// at that workplace's hourly wage) worked up to and including that record.
export default function CategorySummary({ categories, schedules, onRemoveCategory, onUpdateCategory }) {
  const [editingId, setEditingId] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftWage, setDraftWage] = useState('')

  if (categories.length === 0) {
    return null
  }

  const scheduleEntries = allEntries(schedules)

  function startEditing(category) {
    setEditingId(category.id)
    setDraftName(category.name)
    setDraftWage(String(category.hourlyWage || ''))
  }

  function commitEditing(id) {
    onUpdateCategory(id, { name: draftName, hourlyWage: draftWage })
    setEditingId(null)
  }

  function handleKeyDown(e, id) {
    if (e.key === 'Enter') commitEditing(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-800">근무처별 누적 근무시간</h3>

      {categories.map((category) => {
        const records = scheduleEntries
          .filter((s) => s.categoryId === category.id)
          .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

        let cumulativeMinutes = 0
        const color = colorFor(category.color)
        const isEditing = editingId === category.id

        return (
          <div key={category.id} className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={draftName}
                      autoFocus
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, category.id)}
                      className="min-w-0 flex-1 rounded border border-indigo-300 px-1.5 py-0.5 text-sm text-slate-700 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={draftWage}
                      onChange={(e) => setDraftWage(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, category.id)}
                      placeholder="시급"
                      className="w-16 shrink-0 rounded border border-indigo-300 px-1.5 py-0.5 text-sm text-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => commitEditing(category.id)}
                      className="shrink-0 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      저장
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(category)}
                    className="flex min-w-0 items-baseline gap-1.5 text-left hover:underline"
                    title="이름/시급 수정"
                  >
                    <span className="truncate text-sm font-semibold text-slate-700">{category.name}</span>
                    {category.hourlyWage > 0 && (
                      <span className="shrink-0 text-xs text-slate-400">시급 {formatWon(category.hourlyWage)}</span>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveCategory(category.id)}
                className="shrink-0 text-xs text-slate-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>

            {records.length === 0 ? (
              <p className="text-xs text-slate-400">등록된 근무 기록이 없습니다.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="pb-1 font-normal">날짜</th>
                    <th className="pb-1 font-normal">근무시간</th>
                    <th className="pb-1 font-normal">누적</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => {
                    const minutes = workedMinutes(record.startTime, record.endTime, record.breakMinutes)
                    cumulativeMinutes += minutes
                    return (
                      <tr key={record.id} className="border-t border-slate-50">
                        <td className="py-1 text-slate-600">{record.date}</td>
                        <td className="py-1 text-slate-600">{formatHours(minutes)}h</td>
                        <td className="py-1 font-medium text-slate-700">
                          {index >= 1 ? (
                            <>
                              {formatHours(cumulativeMinutes)}h
                              {category.hourlyWage > 0 && (
                                <span className="ml-1 text-indigo-500">
                                  ({formatWon(calculatePay(cumulativeMinutes, category.hourlyWage))})
                                </span>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
