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
// `onError` is called (with the Firestore error) whenever a write fails —
// a permission-denied rule, being offline, a bad connection, etc. Without
// this, a failed write used to just log to the console: the local edit
// still looked like it worked, and only a later reload — reading the
// cloud doc that never actually got the change — would reveal it hadn't
// saved, by which point it looks like the edit "undid itself".
export function createSerializedWriter(onError) {
  let pending = null
  let latestValue = null

  function flush(uid, field) {
    const value = latestValue
    latestValue = null
    pending = setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true })
      .catch((err) => {
        console.error(err)
        onError?.(err)
      })
      .finally(() => {
        pending = null
        if (latestValue !== null) flush(uid, field)
      })
  }

  return {
    write(uid, field, value) {
      latestValue = value
      if (!pending) flush(uid, field)
    },
    // True while a write is in flight or another is queued behind it —
    // used to warn before the tab closes/reloads mid-save, since an
    // in-flight request can otherwise be silently cut off by navigation.
    isPending() {
      return !!pending || latestValue !== null
    },
  }
}
