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

// Categories represent workplaces: { id, name, color, hourlyWage }
export function useCategories() {
  const [categories, setCategories] = useState(loadCategories)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories])

  function addCategory(name, hourlyWage) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const category = { id: makeId(), name: trimmed, color: nextColorKey(categories.length), hourlyWage: Number(hourlyWage) || 0 }
    setCategories((prev) => [...prev, category])
    return category
  }

  function removeCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCategory(id, { name, hourlyWage }) {
    const trimmed = name.trim()
    if (!trimmed) return
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed, hourlyWage: Number(hourlyWage) || 0 } : c)),
    )
  }

  return { categories, addCategory, removeCategory, updateCategory }
}
