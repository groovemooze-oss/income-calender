import { useEffect } from 'react'
import { doc, increment, setDoc } from 'firebase/firestore'
import { db, firebaseEnabled } from './firebase'

// Fire-and-forget site-visit counter, bumped once per page load. Nobody —
// not even the app itself — can read stats/visits back (see
// firestore.rules); it's checked from the Firebase console only. A
// failure here is swallowed on purpose: this is a nice-to-have, not
// something a visitor should ever see an error about.
export function useVisitCounter() {
  useEffect(() => {
    if (!firebaseEnabled) return
    setDoc(doc(db, 'stats', 'visits'), { count: increment(1) }, { merge: true }).catch(() => {})
  }, [])
}
