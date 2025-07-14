import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserData } from '@/lib/firebase/auth'
import type { User as AppUser } from '@/types'

interface AuthState {
  user: User | null
  userData: AppUser | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userData = await getUserData(user.uid)
          setAuthState({
            user,
            userData,
            loading: false,
            error: null,
          })
        } else {
          setAuthState({
            user: null,
            userData: null,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        setAuthState({
          user: null,
          userData: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        })
      }
    })

    return () => unsubscribe()
  }, [])

  return authState
}