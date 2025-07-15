import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  RecaptchaVerifier,
  ConfirmationResult,
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

// Google認証でサインイン
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  
  const userCredential = await signInWithPopup(auth, provider)
  const user = userCredential.user

  // ユーザー情報をFirestoreに保存（初回のみ）
  await ensureUserDocument(user)
  
  return user
}

// 電話番号認証でサインイン（reCAPTCHAセットアップ）
export const setupRecaptcha = (elementId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'normal',
    callback: () => {
      console.log('reCAPTCHA solved')
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired')
    }
  })
}

// 電話番号にSMS送信
export const sendPhoneVerification = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

// SMS認証コード確認
export const verifyPhoneCode = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> => {
  const userCredential = await confirmationResult.confirm(code)
  const user = userCredential.user

  // ユーザー情報をFirestoreに保存（初回のみ）
  await ensureUserDocument(user)
  
  return user
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

// ユーザーのFirestoreドキュメントを確認・作成
export const ensureUserDocument = async (user: User): Promise<void> => {
  try {
    const userData = await getUserData(user.uid)
    
    if (!userData) {
      // ユーザードキュメントが存在しない場合は作成
      const userDoc: Omit<AppUser, 'id'> = {
        email: user.email || '',
        name: user.displayName || 'ユーザー',
        role: user.email === 's.kosei0626@gmail.com' ? 'admin' : 'user',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      }
      await setDoc(doc(db, 'users', user.uid), userDoc)
      console.log('User document created for:', user.email)
    }

    // マスターアカウントの権限確認
    await ensureMasterAccountAdmin(user)
  } catch (error) {
    console.error('Error ensuring user document:', error)
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