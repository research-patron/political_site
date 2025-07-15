"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChanged, getCurrentUser, getUserData, ensureMasterAccountAdmin } from '@/lib/firebase/auth'
import { auth } from '@/lib/firebase/config'
import type { User as AppUser } from '@/types'

interface AuthContextType {
  user: AppUser | null
  firebaseUser: User | null
  loading: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 管理者かどうかを判定
  const isAdmin = user?.role === 'admin' || firebaseUser?.email === 's.kosei0626@gmail.com'

  const refreshUser = async () => {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      const userData = await getUserData(currentUser.uid)
      setUser(userData)
      setFirebaseUser(currentUser)
      
      // マスターアカウントの場合は権限を確認・設定
      await ensureMasterAccountAdmin(currentUser)
    } else {
      setUser(null)
      setFirebaseUser(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      
      if (firebaseUser) {
        try {
          // マスターアカウントの権限確認・設定
          await ensureMasterAccountAdmin(firebaseUser)
          
          // ユーザーデータを取得
          const userData = await getUserData(firebaseUser.uid)
          setUser(userData)
          setFirebaseUser(firebaseUser)
        } catch (error) {
          console.error('Error loading user data:', error)
          setUser(null)
          setFirebaseUser(null)
        }
      } else {
        setUser(null)
        setFirebaseUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = {
    user,
    firebaseUser,
    loading,
    isAdmin,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext