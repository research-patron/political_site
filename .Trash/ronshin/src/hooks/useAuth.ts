import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebaseユーザーからアプリユーザーデータを取得
  const getUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  };

  // 新規ユーザーデータの作成
  const createUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || '',
      role: 'free',
      createdAt: new Date(),
      lastLogin: new Date(),
      savedNewspapers: 0,
      generationCount: 0
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    return userData;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let userData = await getUserData(firebaseUser);
          if (!userData) {
            userData = await createUserData(firebaseUser);
          }
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '認証エラーが発生しました');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserData({ ...firebaseUser, displayName: name });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'サインアップに失敗しました');
      throw e;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインに失敗しました');
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Googleログインに失敗しました');
      throw e;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'パスワードリセットに失敗しました');
      throw e;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログアウトに失敗しました');
      throw e;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    logout
  };
};
