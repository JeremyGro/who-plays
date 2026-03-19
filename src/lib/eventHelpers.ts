export interface Attendee {
  uid: string
  name: string
}

export interface EventDoc {
  cancelled: boolean
  cancelledAt: string | null
  cancelledReason: string | null
  attendees: Attendee[]       // objects with uid + name
  lastResetAt: string | null
  updatedAt: string
}

/** Returns "YYYY-MM-DD" for this week's Tuesday (or today if it's Tuesday) */
export function getThisTuesdayDate(): string {
  const now  = new Date()
  const day  = now.getDay()           // 0 Sun … 6 Sat; 2 = Tue
  const diff = (2 - day + 7) % 7
  const tue  = new Date(now)
  tue.setDate(now.getDate() + diff)
  return tue.toISOString().split('T')[0]
}

export function formatTuesdayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
