import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// A rapid burst of local edits (e.g. RepeatScheduleModal adding many dates,
// or two quick deletes) each fire their own async Firestore write. Those
// requests can land at the server out of order, so whichever happens to
// arrive last "wins" — even if it was issued first and carries stale data,
// silently reverting a later edit. This serializes writes per caller: at
// most one request in flight at a time, and once it resolves, any writes
// requested meanwhile are collapsed into a single follow-up carrying the
// latest value — so the doc always ends up matching the most recent local
// state, never an intermediate one.
export function createSerializedWriter() {
  let pending = null
  let latestValue = null

  function flush(uid, field) {
    const value = latestValue
    latestValue = null
    pending = setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true })
      .catch((err) => console.error(err))
      .finally(() => {
        pending = null
        if (latestValue !== null) flush(uid, field)
      })
  }

  return function write(uid, field, value) {
    latestValue = value
    if (!pending) flush(uid, field)
  }
}
