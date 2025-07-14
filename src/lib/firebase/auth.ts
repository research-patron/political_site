import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { User as AppUser } from '@/types'

export const createUser = async (email: string, password: string, name: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Update profile with display name
  await updateProfile(user, { displayName: name })

  // Create user document in Firestore
  const userDoc: Omit<AppUser, 'id'> = {
    email: user.email!,
    name,
    role: user.email === 's.kosei0626@gmail.com' ? 'admin' : 'user',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  }

  await setDoc(doc(db, 'users', user.uid), userDoc)

  return user
}

export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const logOut = async (): Promise<void> => {
  await signOut(auth)
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const getUserData = async (uid: string): Promise<AppUser | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists()) {
    return { id: uid, ...userDoc.data() } as AppUser
  }
  return null
}

export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false
  
  // Check for master account email
  if (user.email === 's.kosei0626@gmail.com') {
    return true
  }
  
  // Check user role in Firestore
  try {
    const userData = await getUserData(user.uid)
    return userData?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export const requireAdmin = async (user: User | null): Promise<void> => {
  const adminStatus = await isAdmin(user)
  if (!adminStatus) {
    throw new Error('Admin privileges required')
  }
}

export const ensureMasterAccountAdmin = async (user: User): Promise<void> => {
  if (user.email === 's.kosei0626@gmail.com') {
    try {
      const userData = await getUserData(user.uid)
      if (userData && userData.role !== 'admin') {
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          updatedAt: new Date(),
        })
        console.log('Master account upgraded to admin')
      } else if (!userData) {
        // Create user document if it doesn't exist
        const userDoc: Omit<AppUser, 'id'> = {
          email: user.email!,
          name: user.displayName || 'Master Admin',
          role: 'admin',
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        }
        await setDoc(doc(db, 'users', user.uid), userDoc)
        console.log('Master account created with admin privileges')
      }
    } catch (error) {
      console.error('Error ensuring master account admin:', error)
    }
  }
}

export { onAuthStateChanged }