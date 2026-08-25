const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

// Always renders 0~24-hour dropdowns, regardless of the browser's locale
// (native <input type="time"> shows AM/PM in some locales).
export default function TimeSelect({ name, value, onChange, className }) {
  const [hh, mm] = (value || '09:00').split(':')
  const minuteOptions = MINUTES.includes(mm) ? MINUTES : [...MINUTES, mm].sort()

  function emit(nextHH, nextMM) {
    onChange({ target: { name, value: `${nextHH}:${nextMM}` } })
  }

  const selectClassName =
    className ??
    'flex-1 rounded-lg border border-white/60 bg-white/50 px-2 py-2 text-slate-800 backdrop-blur-sm focus:border-indigo-500 focus:bg-white/70 focus:outline-none'

  return (
    <div className="flex items-center gap-1">
      <select value={hh} onChange={(e) => emit(e.target.value, mm)} className={selectClassName} aria-label="시">
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select value={mm} onChange={(e) => emit(hh, e.target.value)} className={selectClassName} aria-label="분">
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
