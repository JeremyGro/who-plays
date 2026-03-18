import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getThisTuesdayDate } from '@/lib/eventHelpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  const cronSecret  = req.headers.get('authorization')

  const ok = adminSecret === process.env.ADMIN_SECRET ||
             cronSecret  === `Bearer ${process.env.CRON_SECRET}`

  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await adminDb.collection('events').doc('tuesday').update({
    attendees:       [],
    cancelled:       false,
    cancelledAt:     null,
    cancelledReason: null,
    lastResetAt:     getThisTuesdayDate(),
    updatedAt:       new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
