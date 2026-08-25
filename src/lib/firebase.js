import { getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Cloud sync/login is optional: without these env vars (e.g. a local
// checkout with no .env), the app just stays in local-only guest mode
// instead of crashing on a missing Firebase config.
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const app = firebaseEnabled ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null

export const auth = firebaseEnabled ? getAuth(app) : null
export const db = firebaseEnabled ? getFirestore(app) : null
export const googleProvider = firebaseEnabled ? new GoogleAuthProvider() : null
