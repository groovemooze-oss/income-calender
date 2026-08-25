import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, firebaseEnabled, googleProvider } from './firebase'

// Wraps Firebase Auth's Google sign-in. `user` is null both while loading
// and while signed out; check `authLoading` to distinguish the two.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled) return
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
  }, [])

  function signInWithGoogle() {
    if (!firebaseEnabled) return
    signInWithPopup(auth, googleProvider).catch((err) => {
      if (err?.code !== 'auth/popup-closed-by-user') console.error(err)
    })
  }

  function signOutUser() {
    if (!firebaseEnabled) return
    signOut(auth).catch((err) => console.error(err))
  }

  return { user, authLoading, firebaseEnabled, signInWithGoogle, signOutUser }
}
