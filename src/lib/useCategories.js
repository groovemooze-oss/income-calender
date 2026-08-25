import { useEffect, useState } from 'react'
import { nextColorKey } from './colors'

const STORAGE_KEY = 'workCategories'

function loadCategories() {
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
// { id, name, color, hourlyWage, noBreak, tax3_3, taxInsurance }
// `noBreak` is the workplace's remembered "no break time" preference, used
// to default the break-time checkbox for new entries at that workplace.
// `tax3_3`/`taxInsurance` control which deductions apply to that
// workplace's pay (see lib/pay.js).
export function useCategories() {
  const [categories, setCategories] = useState(loadCategories)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories])

  function addCategory(name, hourlyWage, tax3_3, taxInsurance) {
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
    }
    setCategories((prev) => [...prev, category])
    return category
  }

  function removeCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCategory(id, { name, hourlyWage, tax3_3, taxInsurance }) {
    const trimmed = name.trim()
    if (!trimmed) return
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name: trimmed, hourlyWage: Number(hourlyWage) || 0, tax3_3: !!tax3_3, taxInsurance: !!taxInsurance }
          : c,
      ),
    )
  }

  function setCategoryNoBreak(id, noBreak) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, noBreak } : c)))
  }

  return { categories, addCategory, removeCategory, updateCategory, setCategoryNoBreak }
}
