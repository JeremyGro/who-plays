'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  reload,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

interface AuthCtx {
  user: User | null
  loading: boolean
  login:                  (email: string, pw: string) => Promise<void>
  loginWithGoogle:        () => Promise<void>
  register:               (email: string, pw: string, name: string) => Promise<void>
  sendVerificationEmail:  () => Promise<void>
  reloadUser:             () => Promise<void>
  logout:                 () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => {}, loginWithGoogle: async () => {}, register: async () => {},
  sendVerificationEmail: async () => {}, reloadUser: async () => {},
  logout: async () => {},
})

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Flag to pause the onAuthStateChanged listener during registration
  // so it doesn't race-overwrite the user object before updateProfile finishes
  const skipNextAuthEvent = useRef(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (skipNextAuthEvent.current) {
        skipNextAuthEvent.current = false
        return
      }
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = async (email: string, pw: string) => {
    await signInWithEmailAndPassword(auth, email, pw)
  }

  // Google sign-in: always email-verified, displayName comes from Google profile
  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
    // onAuthStateChanged handles setting user state
  }

  const register = async (email: string, pw: string, name: string) => {
    // Skip the immediate onAuthStateChanged fire that has no displayName yet
    skipNextAuthEvent.current = true
    const cred = await createUserWithEmailAndPassword(auth, email, pw)
    // updateProfile mutates cred.user.displayName in place
    await updateProfile(cred.user, { displayName: name })
    await sendEmailVerification(cred.user)
    // Force token refresh so the JWT carries the displayName claim
    await cred.user.getIdToken(true)
    // Now set user — displayName is guaranteed to be set
    setUser(cred.user)
    setLoading(false)
  }

  const sendVerificationEmail = async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }

  const reloadUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser)
      await auth.currentUser.getIdToken(true)
      setUser({ ...auth.currentUser })
    }
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, sendVerificationEmail, reloadUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
