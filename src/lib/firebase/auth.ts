import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
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
    role: 'user',
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

export { onAuthStateChanged }