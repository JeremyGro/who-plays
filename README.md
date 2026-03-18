# Tuesday Meetup

A weekly recurring RSVP app. Users **log in** with email/password and click "I'm coming" or "Not this week". The attendee list shows everyone's name. The admin can cancel the event. Attendees reset automatically every Tuesday at 23:00.

---

## Stack

- **Next.js 14** (App Router)
- **Firebase Auth** — email/password sign-in with display name
- **Firestore** — single document stores event state + attendees with names
- **Firebase Admin SDK** — server-side token verification & writes
- **Vercel Cron** — automatic Tuesday EOD reset

---

## Quick Start

### 1. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a project
2. **Authentication** → Sign-in method → enable **Email/Password**
3. **Firestore Database** → create database (production mode)
4. **Project Settings → Service Accounts → Generate new private key** → download JSON

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values from the Firebase console and service account JSON.

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Project Settings → General → Your apps |
| `FIREBASE_ADMIN_PROJECT_ID` | Service account JSON → `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account JSON → `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account JSON → `private_key` |
| `ADMIN_SECRET` | Any strong password you choose |
| `CRON_SECRET` | Any strong secret for the Vercel cron job |

### 3. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How it works

### User flow
1. User visits `/` → redirected to login if not signed in
2. Sign up at `/register` with name + email + password
3. Back on the main page, click **I'm coming** or **Not this week**
4. The attendee list shows all names of people who are coming
5. Users can change their RSVP at any time

### Admin flow
1. Visit `/admin` → enter `ADMIN_SECRET` password
2. See current status, attendee count, and who's coming
3. **Cancel** the event with an optional reason message
4. **Restore** a cancelled event
5. **Manual reset** — clears all attendees early if needed

### Automatic weekly reset
`vercel.json` configures a Vercel Cron job at **23:00 UTC every Tuesday**:
```
POST /api/reset   (Authorization: Bearer $CRON_SECRET)
```

The reset:
- Clears the `attendees` array
- Sets `cancelled: false` (fresh week)
- Updates `lastResetAt`

> **Vercel Hobby plan**: custom cron schedules require Pro. For Hobby, use a GitHub Actions scheduled workflow instead:

```yaml
# .github/workflows/reset.yml
name: Tuesday Reset
on:
  schedule:
    - cron: '0 23 * * 2'
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST ${{ secrets.APP_URL }}/api/reset \
            -H "x-admin-secret: ${{ secrets.ADMIN_SECRET }}"
```

---

## Firestore document

```
events/tuesday
  cancelled:       boolean
  cancelledAt:     string | null
  cancelledReason: string | null
  attendees:       Array<{ uid: string, name: string }>
  lastResetAt:     string | null   (YYYY-MM-DD)
  updatedAt:       string          (ISO timestamp)
```

---

## File structure

```
src/
├── app/
│   ├── page.tsx               # Main RSVP page
│   ├── layout.tsx             # Root layout + AuthProvider
│   ├── globals.css            # Design tokens + global styles
│   ├── login/page.tsx         # Email/password sign in
│   ├── register/page.tsx      # Create account with name
│   ├── admin/page.tsx         # Admin panel
│   └── api/
│       ├── attendance/
│       │   ├── route.ts       # GET event state
│       │   └── toggle/route.ts # POST toggle RSVP
│       ├── admin/
│       │   └── cancel/route.ts # POST cancel/restore
│       └── reset/route.ts     # POST weekly reset
├── context/
│   └── AuthContext.tsx        # Auth state + login/register/logout
└── lib/
    ├── eventHelpers.ts        # Types + date utilities
    └── firebase/
        ├── client.ts          # Firebase client SDK
        └── admin.ts           # Firebase Admin SDK (server only)
firestore.rules
vercel.json
```
