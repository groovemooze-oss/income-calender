export function calculatePay(minutes, hourlyWage) {
  return (minutes / 60) * (Number(hourlyWage) || 0)
}

export function formatWon(amount) {
  return Math.round(amount).toLocaleString('ko-KR') + '원'
}
