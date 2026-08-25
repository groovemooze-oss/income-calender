// 3.3% freelance/business-income withholding, commonly used for part-time pay.
export const TAX_RATE_3_3 = 0.033

// Combined employee-side rate for the 4 major social insurances
// (국민연금 4.5% + 건강보험 3.545% + 장기요양보험 약 0.46% + 고용보험 0.9%).
// Rates are revised periodically — treat this as a representative estimate.
export const INSURANCE_RATE = 0.094

export function calculatePay(minutes, hourlyWage) {
  return (minutes / 60) * (Number(hourlyWage) || 0)
}

export function taxRateFor(category) {
  if (!category) return 0
  let rate = 0
  if (category.tax3_3) rate += TAX_RATE_3_3
  if (category.taxInsurance) rate += INSURANCE_RATE
  return rate
}

// Final take-home pay for a shift, after whichever deductions the
// workplace has checked. With nothing checked, this equals the gross pay.
export function calculateNetPay(minutes, category) {
  const gross = calculatePay(minutes, category?.hourlyWage)
  return gross * (1 - taxRateFor(category))
}

export function formatWon(amount) {
  return Math.round(amount).toLocaleString('ko-KR') + '원'
}

// 주휴수당 (weekly paid-holiday allowance, 근로기준법 제55조): a week with
// 15+ scheduled hours qualifies. Pay is 8 hours' wage at 40+ weekly hours,
// otherwise (weeklyHours / 40) * 8 hours' wage — overtime past 40h/week
// doesn't grow it further. We can only see actual logged shifts here, not
// a formal work schedule, so a week is treated as fully attended (개근)
// whenever it has any entries; the "employment continues into next week"
// condition isn't checked at all.
export const HOLIDAY_PAY_MIN_HOURS = 15

export function calculateHolidayPay(weeklyMinutes, category) {
  const weeklyHours = weeklyMinutes / 60
  if (weeklyHours < HOLIDAY_PAY_MIN_HOURS) return 0
  const cappedHours = Math.min(weeklyHours, 40)
  const allowanceHours = (cappedHours / 40) * 8
  const gross = allowanceHours * (Number(category?.hourlyWage) || 0)
  return gross * (1 - taxRateFor(category))
}
