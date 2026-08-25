import { useState } from 'react'
import { workedMinutes, formatHours, weekKeyFor, weekRangeLabel } from '../lib/date'
import { colorFor } from '../lib/colors'
import { calculateNetPay, calculateHolidayPay, HOLIDAY_PAY_MIN_HOURS, formatWon } from '../lib/pay'
import { allEntries } from '../lib/useSchedules'

// For each category, records are listed in date order and, starting from
// the 2nd record, annotated with the running cumulative hours (and pay,
// at that workplace's hourly wage, after whichever deductions are
// checked) worked up to and including that record.
export default function CategorySummary({ categories, schedules, onRemoveCategory, onUpdateCategory }) {
  const [editingId, setEditingId] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [draftWage, setDraftWage] = useState('')
  const [draftTax33, setDraftTax33] = useState(false)
  const [draftTaxInsurance, setDraftTaxInsurance] = useState(false)
  const [draftIncludesHolidayPay, setDraftIncludesHolidayPay] = useState(false)

  if (categories.length === 0) {
    return null
  }

  const scheduleEntries = allEntries(schedules)

  function startEditing(category) {
    setEditingId(category.id)
    setDraftName(category.name)
    setDraftWage(String(category.hourlyWage || ''))
    setDraftTax33(!!category.tax3_3)
    setDraftTaxInsurance(!!category.taxInsurance)
    setDraftIncludesHolidayPay(!!category.includesHolidayPay)
  }

  function commitEditing(id) {
    onUpdateCategory(id, {
      name: draftName,
      hourlyWage: draftWage,
      tax3_3: draftTax33,
      taxInsurance: draftTaxInsurance,
      includesHolidayPay: draftIncludesHolidayPay,
    })
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

        const weekMinutes = new Map()
        records.forEach((record) => {
          const key = weekKeyFor(record.date)
          const minutes = workedMinutes(record.startTime, record.endTime, record.breakMinutes)
          weekMinutes.set(key, (weekMinutes.get(key) || 0) + minutes)
        })
        const weeks = Array.from(weekMinutes.entries())
          .map(([weekKey, minutes]) => ({ weekKey, minutes, allowance: calculateHolidayPay(minutes, category) }))
          .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
        const totalAllowance = weeks.reduce((sum, w) => sum + w.allowance, 0)

        return (
          <div key={category.id} className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
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
                      title="이름/시급/세금 수정"
                    >
                      <span className="truncate text-sm font-semibold text-slate-700">{category.name}</span>
                      {category.hourlyWage > 0 && (
                        <span className="shrink-0 text-xs text-slate-400">시급 {formatWon(category.hourlyWage)}</span>
                      )}
                      {(category.tax3_3 || category.taxInsurance) && (
                        <span className="shrink-0 text-xs text-slate-400">
                          ({[category.tax3_3 && '3.3%', category.taxInsurance && '사대보험'].filter(Boolean).join(', ')})
                        </span>
                      )}
                      {category.includesHolidayPay && (
                        <span className="shrink-0 text-xs text-slate-400">주휴수당 포함 시급</span>
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
              {isEditing && (
                <div className="flex gap-3 pl-4 text-xs text-slate-500">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={draftTax33}
                      onChange={(e) => setDraftTax33(e.target.checked)}
                      className="accent-indigo-600"
                    />
                    3.3% 원천징수
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={draftTaxInsurance}
                      onChange={(e) => setDraftTaxInsurance(e.target.checked)}
                      className="accent-indigo-600"
                    />
                    사대보험
                  </label>
                </div>
              )}
              {isEditing && (
                <label className="flex items-center gap-1.5 pl-4 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={draftIncludesHolidayPay}
                    onChange={(e) => setDraftIncludesHolidayPay(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  시급에 주휴수당 포함됨 (별도 계산 안 함)
                </label>
              )}
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
                                  ({formatWon(calculateNetPay(cumulativeMinutes, category))})
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

            {category.hourlyWage > 0 && weeks.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2">
                {category.includesHolidayPay ? (
                  <p className="text-xs text-slate-400">
                    이 근무처는 시급에 주휴수당이 포함되어 있어 별도로 계산하지 않습니다.
                  </p>
                ) : (
                  <>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        주휴수당 (주 {HOLIDAY_PAY_MIN_HOURS}시간 이상 시)
                      </span>
                      {totalAllowance > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">합계 {formatWon(totalAllowance)}</span>
                      )}
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="pb-1 font-normal">주</th>
                          <th className="pb-1 font-normal">근무시간</th>
                          <th className="pb-1 font-normal">주휴수당</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeks.map((week) => (
                          <tr key={week.weekKey} className="border-t border-slate-50">
                            <td className="py-1 text-slate-600">{weekRangeLabel(week.weekKey)}</td>
                            <td className="py-1 text-slate-600">{formatHours(week.minutes)}h</td>
                            <td className={`py-1 font-medium ${week.allowance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {week.allowance > 0 ? formatWon(week.allowance) : '조건 미충족'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-1 text-[10px] leading-tight text-slate-400">
                      해당 주에 등록된 근무는 모두 개근한 것으로 가정하고 계산합니다. 실제 지급 여부는 결근 여부와 다음 주
                      근로 예정 여부에 따라 달라질 수 있습니다.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
