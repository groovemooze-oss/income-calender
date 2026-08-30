import { useEffect, useState } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { nextColorKey } from './colors'
import { db } from './firebase'
import { createSerializedWriter } from './firestoreSync'

const STORAGE_KEY = 'workCategories'

function loadLocalCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function makeId() {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Categories represent workplaces:
// { id, name, color, hourlyWage, noBreak, tax3_3, taxInsurance, includesHolidayPay }
// `noBreak` is the workplace's remembered "no break time" preference, used
// to default the break-time checkbox for new entries at that workplace.
// `tax3_3`/`taxInsurance` control which deductions apply to that
// workplace's pay (see lib/pay.js). `includesHolidayPay` means the hourly
// wage already has 주휴수당 folded in, so it isn't calculated separately.
//
// With no `uid` (guest mode), categories live in localStorage only. Signed
// in, they live in Firestore at users/{uid}.categories instead: the local
// copy on first sign-in is migrated up if the cloud doc has none yet, then
// onSnapshot keeps this device and any other signed-in device in sync.
export function useCategories(uid) {
  const [categories, setCategories] = useState(uid ? [] : loadLocalCategories)
  const [syncError, setSyncError] = useState(null)
  const [writer] = useState(() => createSerializedWriter((err) => setSyncError(err.message || String(err))))

  useEffect(() => {
    if (!uid) {
      setCategories(loadLocalCategories())
      return
    }
    const ref = doc(db, 'users', uid)
    let cancelled = false
    getDoc(ref).then((snap) => {
      if (cancelled || snap.data()?.categories !== undefined) return
      writer.write(uid, 'categories', loadLocalCategories())
    })
    const unsubscribe = onSnapshot(ref, (snap) => {
      const cloudCategories = snap.data()?.categories
      if (cloudCategories !== undefined) setCategories(cloudCategories)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [uid, writer])

  useEffect(() => {
    if (uid) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories, uid])

  // Refreshing or closing the tab mid-save would otherwise cut the request
  // off, so the edit never reaches Firestore — reopening later then shows
  // the old data, as if the edit had silently undone itself.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!writer.isPending()) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [writer])

  // Applies a local update immediately, and mirrors it to Firestore when
  // signed in (onSnapshot above will echo the same value back). Takes an
  // updater so calls made in the same synchronous batch each see the
  // previous call's result rather than a stale closure value.
  function commit(updater) {
    setCategories((prev) => {
      const next = updater(prev)
      if (uid) {
        setSyncError(null)
        writer.write(uid, 'categories', next)
      }
      return next
    })
  }

  function addCategory(name, hourlyWage, tax3_3, taxInsurance, includesHolidayPay) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const category = {
      id: makeId(),
      name: trimmed,
      color: nextColorKey(categories.length),
      hourlyWage: Number(hourlyWage) || 0,
      noBreak: false,
      tax3_3: !!tax3_3,
      taxInsurance: !!taxInsurance,
      includesHolidayPay: !!includesHolidayPay,
    }
    commit((prev) => [...prev, category])
    return category
  }

  function removeCategory(id) {
    commit((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCategory(id, { name, hourlyWage, tax3_3, taxInsurance, includesHolidayPay }) {
    const trimmed = name.trim()
    if (!trimmed) return
    commit((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              name: trimmed,
              hourlyWage: Number(hourlyWage) || 0,
              tax3_3: !!tax3_3,
              taxInsurance: !!taxInsurance,
              includesHolidayPay: !!includesHolidayPay,
            }
          : c,
      ),
    )
  }

  function setCategoryNoBreak(id, noBreak) {
    commit((prev) => prev.map((c) => (c.id === id ? { ...c, noBreak } : c)))
  }

  return { categories, addCategory, removeCategory, updateCategory, setCategoryNoBreak, syncError }
}
