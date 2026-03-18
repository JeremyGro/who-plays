import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cancelled, reason } = await req.json() as { cancelled: boolean; reason?: string }
  const ref = adminDb.collection('events').doc('tuesday')

  await ref.update({
    cancelled,
    cancelledAt:     cancelled ? new Date().toISOString() : null,
    cancelledReason: cancelled ? (reason ?? null) : null,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, cancelled })
}
