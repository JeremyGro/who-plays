'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase/client'
import { formatTuesdayDate, Attendee } from '@/lib/eventHelpers'
import Link from 'next/link'

interface EventState {
  cancelled: boolean
  cancelledReason: string | null
  attendees: Attendee[]
  thisTuesday: string
  lastResetAt: string | null
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
]

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name }: { name: string }) {
  const colorClass = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${colorClass}`}>
      {getInitials(name)}
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green" />
      <span className="text-sm font-semibold text-ink">TSVE 3X3</span>
    </div>
  )
}

export default function HomePage() {
  const { user, loading: authLoading, logout, sendVerificationEmail, reloadUser } = useAuth()
  const [event,     setEvent]     = useState<EventState | null>(null)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [busy,      setBusy]      = useState(false)
  const [fetching,  setFetching]  = useState(true)
  const [error,     setError]     = useState('')
  const [resent,    setResent]    = useState(false)
  const [resending, setResending] = useState(false)
  const [reloading, setReloading] = useState(false)

  const fetchEvent = useCallback(async () => {
    setFetching(true)
    try {
      const res  = await fetch('/api/attendance')
      const data = await res.json() as EventState
      setEvent(data)
      if (user) setAttending((data.attendees ?? []).some((a: Attendee) => a.uid === user.uid))
    } catch {
      setError('Could not load event.')
    } finally {
      setFetching(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) fetchEvent()
    else if (!authLoading && !user) setFetching(false)
  }, [user, authLoading, fetchEvent])

  const handleToggle = async (wantAttend: boolean) => {
    if (!user || busy || !event || event.cancelled || attending === wantAttend) return
    setBusy(true); setError('')
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/attendance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attending: wantAttend, name: auth.currentUser?.displayName ?? '' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAttending(data.attending)
      setEvent(prev => prev ? { ...prev, attendees: data.attendees } : prev)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try { await sendVerificationEmail(); setResent(true) } catch {}
    setResending(false)
  }

  const handleCheckVerified = async () => {
    setReloading(true)
    await reloadUser()
    setReloading(false)
  }

  // ── Not logged in ──
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-border rounded-card shadow-card p-7 animate-fade-up">
          <Logo />
          <h1 className="font-serif text-2xl text-ink font-normal mt-5 mb-2">Einloggen TSVE 3X3</h1>
          <p className="text-sm text-muted mb-5">Logge dich jetzt ein um zu teilen ob du zockst oder nicht.</p>
          <div className="flex gap-2.5">
            <Link href="/login" className="flex-1 text-center py-2.5 bg-green text-white rounded-xl text-sm font-semibold no-underline">
              Einloggen
            </Link>
            <Link href="/register" className="flex-1 text-center py-2.5 bg-white border border-border text-ink rounded-xl text-sm font-semibold no-underline">
              Account erstellen
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading ──
  if (authLoading || fetching) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm text-muted">Lädt…</p>
      </main>
    )
  }

  // ── Email not verified ──
  if (user && !user.emailVerified) {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 gap-3">
        <div className="w-full max-w-sm flex items-center justify-between animate-fade-up">
          <Logo />
          <button onClick={logout} className="text-sm text-muted hover:text-ink bg-transparent border-none cursor-pointer p-0">
            Ausloggen
          </button>
        </div>
        <div className="w-full max-w-sm bg-white border border-border rounded-card shadow-card p-7 animate-fade-up-1">
          <div className="w-14 h-14 rounded-2xl bg-green-bg border border-green-border flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a6049" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-serif text-xl text-ink font-normal mb-2">Email bestätigen</h1>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Wir haben einen Link <strong className="text-ink font-semibold">{user.email}</strong> verschickt.
            Klicke auf den Bestätigungslink um einen Account zu aktivieren.
          </p>
          <button
            onClick={handleCheckVerified}
            disabled={reloading}
            className="w-full py-2.5 bg-green text-white rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
          >
            {reloading ? 'Checking…' : "I've verified my email"}
          </button>
          <div className="mt-3 text-center">
            {resent
              ? <span className="text-xs text-green">✓ Email erneut gesendet</span>
              : <button onClick={handleResend} disabled={resending} className="text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer p-0">
                  {resending ? 'Sending…' : 'Resend verification email'}
                </button>
            }
          </div>
        </div>
      </main>
    )
  }

  const attendees = event?.attendees ?? []
  const count     = attendees.length

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">

      {/* Topbar */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-3 animate-fade-up">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user?.displayName ?? user?.email}</span>
          <button onClick={logout} className="text-xs text-muted hover:text-ink bg-transparent border-none cursor-pointer p-0">
            Ausloggen
          </button>
          <Link href="/admin" className="text-xs text-muted hover:text-ink no-underline">Admin</Link>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white border border-border rounded-card shadow-card p-7 animate-fade-up-1">

        {event?.thisTuesday && (
          <p className="text-[11px] font-semibold tracking-widest uppercase text-green mb-2">
            {formatTuesdayDate(event.thisTuesday)}
          </p>
        )}

        <h1 className="font-serif text-[26px] leading-tight text-ink font-normal mb-5">
          3X3 in der <br />TSVE Halle um 20 Uhr?
        </h1>

        {/* Cancelled banner */}
        {event?.cancelled && (
          <div className="flex items-start gap-2.5 bg-red-bg border border-red-border rounded-xl px-3.5 py-3 text-red mb-4">
            <span className="text-base leading-none mt-0.5">✕</span>
            <div>
              <strong className="block text-sm font-semibold">Termin wurde abgesagt</strong>
              {event.cancelledReason && <span className="text-xs">{event.cancelledReason}</span>}
            </div>
          </div>
        )}

        {/* RSVP buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleToggle(true)}
            disabled={busy || !!event?.cancelled}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50
              ${attending === true
                ? 'bg-green border-green text-white shadow-sm'
                : 'bg-green-bg border-green-border text-green hover:bg-green-100'}`}
          >
            {attending === true && '✓ '}Ich zocke
          </button>
          <button
            onClick={() => handleToggle(false)}
            disabled={busy || !!event?.cancelled}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50
              ${attending === false
                ? 'bg-ink border-ink text-white'
                : 'bg-paper border-border text-muted hover:text-ink hover:bg-stone-100'}`}
          >
            {attending === false && '✕ '}Bin raus
          </button>
        </div>

        {error && <p className="text-xs text-red mt-2">{error}</p>}

        <div className="h-px bg-border my-5" />

        {/* Attendees */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] font-semibold text-ink">Zockt diese Woche</span>
          <span className="text-xs font-semibold text-muted bg-paper border border-border rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>

        {count === 0 ? (
          <p className="text-xs text-faint">Noch keine Zusage - sei der erste!</p>
        ) : (
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {attendees.map((a) => (
              <li key={a.uid} className="flex items-center gap-2.5">
                <Avatar name={a.name} />
                <span className={`text-sm ${a.uid === user?.uid ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {a.name}
                  {a.uid === user?.uid && (
                    <span className="text-xs text-faint font-normal ml-1.5">(you)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-faint mt-3 animate-fade-up-2">Wird jeden Dienstag um 23:00 Uhr zurückgesetzt</p>
    </main>
  )
}
