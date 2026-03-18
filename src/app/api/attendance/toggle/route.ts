import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { EventDoc, Attendee } from '@/lib/eventHelpers'

export async function POST(req: NextRequest) {
  // Verify token
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Accept name from the request body — auth.currentUser.displayName on the client
  // is always correct after updateProfile, even before the JWT refreshes.
  const { attending, name: clientName } = await req.json() as { attending: boolean; name: string }
  const name = (clientName ?? '').trim() || 'Unknown'

  const ref  = adminDb.collection('events').doc('tuesday')
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const data = snap.data() as EventDoc
  if (data.cancelled) return NextResponse.json({ error: 'Event cancelled' }, { status: 409 })

  let attendees: Attendee[] = data.attendees ?? []

  if (attending) {
    // Always upsert with latest name
    attendees = [...attendees.filter(a => a.uid !== uid), { uid, name }]
  } else {
    attendees = attendees.filter(a => a.uid !== uid)
  }

  await ref.update({ attendees, updatedAt: new Date().toISOString() })
  return NextResponse.json({ attending, attendees })
}
