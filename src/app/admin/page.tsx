'use client'

import { useState } from 'react'
import { formatTuesdayDate, Attendee } from '@/lib/eventHelpers'
import Link from 'next/link'

interface EventState {
  cancelled: boolean
  cancelledReason: string | null
  attendees: Attendee[]
  thisTuesday: string
  lastResetAt: string | null
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green" />
      <span className="text-sm font-semibold text-ink">Tuesday Meetup</span>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm text-ink bg-paper outline-none focus:border-ink transition-colors'
const cardCls  = 'bg-white border border-border rounded-card shadow-card p-5 mb-2.5'

export default function AdminPage() {
  const [secret,   setSecret]   = useState('')
  const [authed,   setAuthed]   = useState(false)
  const [authErr,  setAuthErr]  = useState('')
  const [event,    setEvent]    = useState<EventState | null>(null)
  const [reason,   setReason]   = useState('')
  const [busy,     setBusy]     = useState(false)
  const [message,  setMessage]  = useState('')
  const [fetching, setFetching] = useState(false)

  const fetchEvent = async () => {
    setFetching(true)
    const res  = await fetch('/api/attendance')
    setEvent(await res.json())
    setFetching(false)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthErr('')
    const res = await fetch('/api/admin/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ cancelled: false }),
    })
    if (res.ok) { setAuthed(true); fetchEvent() }
    else setAuthErr('Incorrect password.')
  }

  const handleCancel = async () => {
    if (!event || busy) return
    setBusy(true); setMessage('')
    const res = await fetch('/api/admin/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ cancelled: true, reason }),
    })
    if (res.ok) { setEvent(prev => prev ? { ...prev, cancelled: true, cancelledReason: reason } : prev); setMessage('Event cancelled.'); setReason('') }
    else setMessage('Error cancelling.')
    setBusy(false)
  }

  const handleUncancel = async () => {
    if (!event || busy) return
    setBusy(true); setMessage('')
    const res = await fetch('/api/admin/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ cancelled: false }),
    })
    if (res.ok) { setEvent(prev => prev ? { ...prev, cancelled: false, cancelledReason: null } : prev); setMessage('Event restored.') }
    else setMessage('Error restoring.')
    setBusy(false)
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all attendees for this week?')) return
    setBusy(true); setMessage('')
    const res = await fetch('/api/reset', { method: 'POST', headers: { 'x-admin-secret': secret } })
    if (res.ok) { setEvent(prev => prev ? { ...prev, cancelled: false, attendees: [] } : prev); setMessage('Attendees reset.') }
    else setMessage('Error resetting.')
    setBusy(false)
  }

  // ── Login ──
  if (!authed) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-border rounded-card shadow-card p-7 animate-fade-up">
          <Logo />
          <h1 className="font-serif text-2xl text-ink font-normal mt-5 mb-5">Admin</h1>
          <form onSubmit={handleAuth} className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-ink">Password</label>
            <input
              type="password" required autoFocus value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter admin password"
              className={inputCls}
            />
            {authErr && <p className="text-[13px] text-red mt-1">{authErr}</p>}
            <button type="submit" className="mt-3 py-2.5 bg-green text-white rounded-xl text-sm font-semibold border-none cursor-pointer">
              Enter
            </button>
          </form>
          <Link href="/" className="block mt-4 text-center text-[13px] text-muted no-underline hover:text-ink">
            ← Back to event
          </Link>
        </div>
      </main>
    )
  }

  const attendees = event?.attendees ?? []

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 gap-3">
      <div className="w-full max-w-[480px]">

        {/* Header */}
        <div className="flex items-start justify-between mb-4 animate-fade-up">
          <div>
            <Logo />
            <h1 className="font-serif text-2xl text-ink font-normal mt-1">Admin Panel</h1>
          </div>
          <Link href="/" className="text-[13px] text-muted no-underline hover:text-ink mt-1">← View event</Link>
        </div>

        {fetching ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : event ? (
          <>
            {/* Status */}
            <div className={`${cardCls} animate-fade-up-1`}>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  event.cancelled
                    ? 'bg-red-bg border-red-border text-red'
                    : 'bg-green-bg border-green-border text-green'
                }`}>
                  {event.cancelled ? 'Cancelled' : 'Active'}
                </span>
              </div>
              {event.thisTuesday && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">This Tuesday</span>
                  <span className="text-sm font-medium text-ink">{formatTuesdayDate(event.thisTuesday)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Attendees</span>
                <span className="text-sm font-medium text-ink">{attendees.length}</span>
              </div>
            </div>

            {/* Who's coming */}
            {attendees.length > 0 && (
              <div className={`${cardCls} animate-fade-up-1`}>
                <p className="text-[13px] font-semibold text-ink mb-2.5">Who's coming</p>
                <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                  {attendees.map(a => (
                    <li key={a.uid} className="flex items-center gap-2 text-sm text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                      {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cancel / restore */}
            <div className={`${cardCls} animate-fade-up-1`}>
              <p className="text-[13px] font-semibold text-ink mb-2.5">Cancel this week</p>
              {event.cancelled ? (
                <>
                  <p className="text-sm text-muted mb-3">
                    Currently cancelled{event.cancelledReason ? `: "${event.cancelledReason}"` : ''}.
                  </p>
                  <button onClick={handleUncancel} disabled={busy} className="px-4 py-2.5 bg-paper border border-border text-ink rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
                    Restore event
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="text" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Reason (optional)" className={inputCls}
                  />
                  <button onClick={handleCancel} disabled={busy} className="px-4 py-2.5 bg-red-bg border border-red-border text-red rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
                    Cancel this Tuesday
                  </button>
                </div>
              )}
            </div>

            {/* Manual reset */}
            <div className={`${cardCls} animate-fade-up-1`}>
              <p className="text-[13px] font-semibold text-ink mb-1">Manual reset</p>
              <p className="text-sm text-muted mb-3">
                Clears all attendees and restores the event. Runs automatically at 23:00 every Tuesday.
              </p>
              <button onClick={handleReset} disabled={busy} className="px-4 py-2.5 bg-paper border border-border text-ink rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
                Reset now
              </button>
            </div>

            {message && (
              <p className="text-center text-[13px] text-green mt-1">✓ {message}</p>
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}
