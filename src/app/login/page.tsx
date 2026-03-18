'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

function Logo() {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="w-2 h-2 rounded-full bg-green" />
      <span className="text-sm font-semibold text-ink">Tuesday Meetup</span>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { login, loginWithGoogle, sendVerificationEmail, user } = useAuth()
  const router = useRouter()
  const [email,     setEmail]     = useState('')
  const [pw,        setPw]        = useState('')
  const [error,     setError]     = useState('')
  const [busy,      setBusy]      = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [resending, setResending] = useState(false)

  if (user?.emailVerified) { router.replace('/'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await login(email, pw)
      router.replace('/')
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Wrong email or password.' : 'Sign in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleBusy(true); setError('')
    try {
      await loginWithGoogle()
      router.replace('/')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try again.')
      }
    } finally {
      setGoogleBusy(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try { await sendVerificationEmail(); setResent(true) } catch {}
    setResending(false)
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-border rounded-card shadow-card p-7 animate-fade-up">
        <Logo />

        <h1 className="font-serif text-2xl text-ink font-normal mb-5">Sign in</h1>

        {/* Unverified warning */}
        {user && !user.emailVerified && (
          <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-xl px-3.5 py-3 text-yellow-800 mb-4">
            <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            <div>
              <strong className="block text-[13px] font-semibold">Email not verified</strong>
              <span className="text-xs">
                Check your inbox.{' '}
                {resent
                  ? <span className="text-green font-medium">Resent ✓</span>
                  : <button onClick={handleResend} disabled={resending} className="underline bg-transparent border-none cursor-pointer text-xs text-yellow-800 p-0">
                      {resending ? 'Sending…' : 'Resend email'}
                    </button>
                }
              </span>
            </div>
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={googleBusy || busy}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-border rounded-xl text-sm font-semibold text-ink hover:bg-paper transition-colors cursor-pointer disabled:opacity-50"
        >
          <GoogleIcon />
          {googleBusy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-faint">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
          <label className="text-[13px] font-semibold text-ink mt-2">Email</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="px-3 py-2.5 border border-border rounded-lg text-sm text-ink bg-paper outline-none focus:border-ink transition-colors"
          />
          <label className="text-[13px] font-semibold text-ink mt-2">Password</label>
          <input
            type="password" required value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="••••••••"
            className="px-3 py-2.5 border border-border rounded-lg text-sm text-ink bg-paper outline-none focus:border-ink transition-colors"
          />
          {error && <p className="text-[13px] text-red mt-1">{error}</p>}
          <button
            type="submit" disabled={busy || googleBusy}
            className="mt-3 py-2.5 bg-green text-white rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-muted">
          Don't have an account?{' '}
          <Link href="/register" className="text-green font-semibold no-underline">Create one</Link>
        </p>
      </div>
    </main>
  )
}
