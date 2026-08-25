export default function AuthButton({ firebaseEnabled, authLoading, user, onSignIn, onSignOut }) {
  if (!firebaseEnabled) return null
  if (authLoading) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className="flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/40 px-3 py-1.5 text-sm text-slate-600 backdrop-blur-sm hover:bg-white/60"
      >
        Google로 로그인
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL && (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full" />
      )}
      <span className="hidden text-sm text-slate-600 sm:inline">{user.displayName}</span>
      <button
        type="button"
        onClick={onSignOut}
        className="rounded-lg border border-white/60 bg-white/40 px-3 py-1.5 text-sm text-slate-600 backdrop-blur-sm hover:bg-white/60"
      >
        로그아웃
      </button>
    </div>
  )
}
