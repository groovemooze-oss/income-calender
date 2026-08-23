// Fixed palette so Tailwind's compiler can see every class name statically
// (dynamically built class strings like `bg-${color}-100` are not detected).
export const CATEGORY_COLORS = [
  { key: 'indigo', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700', ring: 'ring-indigo-500' },
  { key: 'rose', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', ring: 'ring-rose-500' },
  { key: 'amber', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', ring: 'ring-amber-500' },
  { key: 'emerald', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-500' },
  { key: 'sky', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700', ring: 'ring-sky-500' },
  { key: 'violet', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', ring: 'ring-violet-500' },
  { key: 'orange', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', ring: 'ring-orange-500' },
  { key: 'teal', dot: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700', ring: 'ring-teal-500' },
]

const BY_KEY = Object.fromEntries(CATEGORY_COLORS.map((c) => [c.key, c]))
const FALLBACK = { key: 'slate', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600', ring: 'ring-slate-400' }

export function colorFor(key) {
  return BY_KEY[key] ?? FALLBACK
}

export function nextColorKey(existingCount) {
  return CATEGORY_COLORS[existingCount % CATEGORY_COLORS.length].key
}
