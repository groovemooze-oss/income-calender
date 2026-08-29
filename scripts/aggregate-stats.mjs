#!/usr/bin/env node
// Computes anonymized, aggregate-only usage stats across all users and
// writes them to Firestore at public_stats/aggregate. Runs with the
// Admin SDK (a service account), which bypasses firestore.rules — the
// per-user users/{uid} docs stay locked to their owner for every other
// reader, client or console. No per-user or per-shift data ever leaves
// this script; only the aggregated numbers below are written out.
//
// A metric is only included once at least MIN_SAMPLE_USERS distinct
// users contributed to it (k-anonymity floor), so no result can be
// traced back to a small enough group to identify anyone.
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { workedMinutes } from '../src/lib/date.js'
import { calculateNetPay } from '../src/lib/pay.js'

const MIN_SAMPLE_USERS = 10

function average(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToClock(totalMinutes) {
  const m = Math.round(totalMinutes) % (24 * 60)
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

async function main() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()

  const snapshot = await db.collection('users').get()

  const shiftMinutesList = []
  const startMinutesList = []
  const endMinutesList = []
  const hourlyWages = []
  const usersWithShifts = new Set()
  const usersWithWage = new Set()
  const monthlyIncomeByUserMonth = new Map()

  snapshot.forEach((doc) => {
    const uid = doc.id
    const { schedules = {}, categories = [] } = doc.data()
    const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

    for (const category of categories) {
      const wage = Number(category.hourlyWage) || 0
      if (wage > 0) {
        hourlyWages.push(wage)
        usersWithWage.add(uid)
      }
    }

    for (const [date, entries] of Object.entries(schedules)) {
      for (const entry of entries) {
        if (!entry?.startTime || !entry?.endTime) continue
        usersWithShifts.add(uid)

        const minutes = workedMinutes(entry.startTime, entry.endTime, entry.breakMinutes)
        shiftMinutesList.push(minutes)
        startMinutesList.push(timeToMinutes(entry.startTime))
        endMinutesList.push(timeToMinutes(entry.endTime))

        const category = categoriesById[entry.categoryId]
        if (category?.hourlyWage > 0) {
          const monthKey = `${uid}_${date.slice(0, 7)}`
          const pay = calculateNetPay(minutes, category)
          monthlyIncomeByUserMonth.set(monthKey, (monthlyIncomeByUserMonth.get(monthKey) || 0) + pay)
        }
      }
    }
  })

  const monthlyIncomes = [...monthlyIncomeByUserMonth.values()]
  const usersWithIncome = new Set([...monthlyIncomeByUserMonth.keys()].map((k) => k.split('_')[0]))

  const result = {
    computedAt: new Date().toISOString(),
    minSampleUsers: MIN_SAMPLE_USERS,
    sampleUserCount: usersWithShifts.size,
    avgShiftMinutes: usersWithShifts.size >= MIN_SAMPLE_USERS ? Math.round(average(shiftMinutesList)) : null,
    avgStartTime: usersWithShifts.size >= MIN_SAMPLE_USERS ? minutesToClock(average(startMinutesList)) : null,
    avgEndTime: usersWithShifts.size >= MIN_SAMPLE_USERS ? minutesToClock(average(endMinutesList)) : null,
    avgHourlyWage: usersWithWage.size >= MIN_SAMPLE_USERS ? Math.round(average(hourlyWages)) : null,
    avgMonthlyIncome: usersWithIncome.size >= MIN_SAMPLE_USERS ? Math.round(average(monthlyIncomes)) : null,
  }

  await db.collection('public_stats').doc('aggregate').set(result)
  console.log('Wrote aggregate stats:', result)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
