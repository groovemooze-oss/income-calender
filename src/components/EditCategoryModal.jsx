import { useState } from 'react'

// The only place a category can be renamed, have its wage/tax settings
// changed, or be deleted — CategorySummary's list only opens this modal,
// it never edits or deletes a category directly.
export default function EditCategoryModal({ category, onSave, onDelete, onClose }) {
  const [name, setName] = useState(category.name)
  const [wage, setWage] = useState(String(category.hourlyWage || ''))
  const [tax33, setTax33] = useState(!!category.tax3_3)
  const [taxInsurance, setTaxInsurance] = useState(!!category.taxInsurance)
  const [includesHolidayPay, setIncludesHolidayPay] = useState(!!category.includesHolidayPay)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    onSave(category.id, { name, hourlyWage: wage, tax3_3: tax33, taxInsurance, includesHolidayPay })
    onClose()
  }

  function handleDelete() {
    onDelete(category.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/60 bg-white/60 p-5 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">근무처 편집</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
            닫기
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          이름
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            className="rounded-lg border border-white/60 bg-white/50 px-3 py-2 text-slate-800 backdrop-blur-sm focus:border-indigo-500 focus:bg-white/70 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          시급
          <input
            type="number"
            min="0"
            step="10"
            value={wage}
            onChange={(e) => setWage(e.target.value)}
            className="rounded-lg border border-white/60 bg-white/50 px-3 py-2 text-slate-800 backdrop-blur-sm focus:border-indigo-500 focus:bg-white/70 focus:outline-none"
          />
        </label>

        <div className="flex gap-3 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={tax33}
              onChange={(e) => setTax33(e.target.checked)}
              className="accent-indigo-600"
            />
            3.3% 원천징수
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={taxInsurance}
              onChange={(e) => setTaxInsurance(e.target.checked)}
              className="accent-indigo-600"
            />
            사대보험
          </label>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={includesHolidayPay}
            onChange={(e) => setIncludesHolidayPay(e.target.checked)}
            className="accent-indigo-600"
          />
          시급에 주휴수당 포함됨 (별도 계산 안 함)
        </label>

        {confirmingDelete ? (
          <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
            <p>정말 삭제할까요? 등록된 근무 기록은 남지만 이 근무처와의 연결은 사라져요.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
              >
                삭제 확인
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg border border-red-300 bg-white/40 px-4 py-2 text-sm text-red-600 backdrop-blur-sm hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
