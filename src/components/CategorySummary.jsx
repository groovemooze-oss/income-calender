import { workedMinutes, formatHours } from '../lib/date'
import { colorFor } from '../lib/colors'

// For each category, records are listed in date order and, starting from
// the 2nd record, annotated with the running cumulative hours worked at
// that workplace up to and including that record.
export default function CategorySummary({ categories, schedules, onRemoveCategory }) {
  if (categories.length === 0) {
    return null
  }

  const allSchedules = Object.values(schedules)

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-800">근무처별 누적 근무시간</h3>

      {categories.map((category) => {
        const records = allSchedules
          .filter((s) => s.categoryId === category.id)
          .sort((a, b) => a.date.localeCompare(b.date))

        let cumulativeMinutes = 0
        const color = colorFor(category.color)

        return (
          <div key={category.id} className="rounded-lg border border-slate-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                <span className="text-sm font-semibold text-slate-700">{category.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveCategory(category.id)}
                className="text-xs text-slate-400 hover:text-red-500"
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
                      <tr key={record.date} className="border-t border-slate-50">
                        <td className="py-1 text-slate-600">{record.date}</td>
                        <td className="py-1 text-slate-600">{formatHours(minutes)}h</td>
                        <td className="py-1 font-medium text-slate-700">
                          {index >= 1 ? `${formatHours(cumulativeMinutes)}h` : '—'}
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
