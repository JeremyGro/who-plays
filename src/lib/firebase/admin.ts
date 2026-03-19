import * as admin from 'firebase-admin'

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, ' +
      'FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY'
    )
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err)
    throw err
  }
}

const adminApp = initAdmin()

export const adminAuth = admin.auth(adminApp)
export const adminDb   = admin.firestore(adminApp)

