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
