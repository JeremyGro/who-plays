import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { EventDoc, getThisTuesdayDate } from '@/lib/eventHelpers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const ref  = adminDb.collection('events').doc('tuesday')
  const snap = await ref.get()
  const thisTuesday = getThisTuesdayDate()

  if (!snap.exists) {
    const initial: EventDoc = {
      cancelled: false, cancelledAt: null, cancelledReason: null,
      attendees: [], lastResetAt: null, updatedAt: new Date().toISOString(),
    }
    await ref.set(initial)
    return NextResponse.json({ ...initial, thisTuesday })
  }

  const data = snap.data() as EventDoc
  return NextResponse.json({ ...data, thisTuesday }, {
    headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' },
  })
}
