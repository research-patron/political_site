import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  admin: boolean;
  verified: boolean;
  prefecture: string | null;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'ja' | 'en';
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  prefecture?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  // Current user observable
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Sign up with email and password
  static async signUp(signUpData: SignUpData): Promise<UserProfile> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signUpData.email, 
        signUpData.password
      );
      
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: signUpData.displayName
      });

      // Create user document in Firestore
      const userProfile = await this.createUserProfile(user, {
        prefecture: signUpData.prefecture || null
      });

      return userProfile;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in with email and password
  static async signIn(signInData: SignInData): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        signInData.email, 
        signInData.password
      );
      
      const user = userCredential.user;

      // Update last login time
      await this.updateLastLogin(user.uid);

      // Get user profile
      const userProfile = await this.getUserProfile(user.uid);
      
      return userProfile;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      
      return {
        uid: uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified,
        admin: userData.admin || false,
        verified: userData.verified || false,
        prefecture: userData.prefecture,
        settings: userData.settings || {
          notifications: true,
          theme: 'light',
          language: 'ja'
        },
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Create user profile in Firestore
  static async createUserProfile(
    user: User, 
    additionalData: { prefecture?: string | null } = {}
  ): Promise<UserProfile> {
    try {
      const userProfile: Omit<UserProfile, 'uid'> = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        admin: false,
        verified: false,
        prefecture: additionalData.prefecture || null,
        settings: {
          notifications: true,
          theme: 'light',
          language: 'ja'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      return {
        uid: user.uid,
        ...userProfile
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  // Update user profile
  static async updateUserProfile(
    uid: string, 
    updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'admin' | 'verified'>>
  ): Promise<UserProfile> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.uid;
      delete updateData.createdAt;
      delete updateData.admin;
      delete updateData.verified;

      await updateDoc(doc(db, 'users', uid), updateData);

      // Return updated profile
      const updatedProfile = await this.getUserProfile(uid);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Failed to update last login time:', error);
      // Don't throw error - this is not critical
    }
  }

  // Get user's ID token
  static async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;

      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  // Get user's claims (including admin status)
  static async getUserClaims(): Promise<any> {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;

      const idTokenResult = await getIdTokenResult(user);
      return idTokenResult.claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return null;
    }
  }

  // Check if current user is admin
  static async isAdmin(): Promise<boolean> {
    try {
      const claims = await this.getUserClaims();
      return claims?.admin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Check if current user is verified
  static async isVerified(): Promise<boolean> {
    try {
      const claims = await this.getUserClaims();
      return claims?.verified === true;
    } catch (error) {
      console.error('Error checking verified status:', error);
      return false;
    }
  }

  // Request admin privileges (Cloud Function)
  static async requestAdminPrivileges(): Promise<{ success: boolean; message: string }> {
    try {
      const requestAdminFunction = httpsCallable(functions, 'requestAdminPrivileges');
      const result = await requestAdminFunction();
      
      return result.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error requesting admin privileges:', error);
      throw new Error(error.message || 'Failed to request admin privileges');
    }
  }

  // Grant admin privileges to user (admin only)
  static async grantAdminPrivileges(targetUid: string): Promise<{ success: boolean; message: string }> {
    try {
      const grantAdminFunction = httpsCallable(functions, 'grantAdminPrivileges');
      const result = await grantAdminFunction({ targetUid });
      
      return result.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error granting admin privileges:', error);
      throw new Error(error.message || 'Failed to grant admin privileges');
    }
  }

  // Revoke admin privileges from user (admin only)
  static async revokeAdminPrivileges(targetUid: string): Promise<{ success: boolean; message: string }> {
    try {
      const revokeAdminFunction = httpsCallable(functions, 'revokeAdminPrivileges');
      const result = await revokeAdminFunction({ targetUid });
      
      return result.data as { success: boolean; message: string };
    } catch (error: any) {
      console.error('Error revoking admin privileges:', error);
      throw new Error(error.message || 'Failed to revoke admin privileges');
    }
  }

  // Get user list (admin only)
  static async getUserList(limit: number = 20): Promise<UserProfile[]> {
    try {
      const getUserListFunction = httpsCallable(functions, 'getUserList');
      const result = await getUserListFunction({ limit });
      
      return result.data as UserProfile[];
    } catch (error: any) {
      console.error('Error getting user list:', error);
      throw new Error(error.message || 'Failed to get user list');
    }
  }

  // Convert Firebase Auth error codes to user-friendly messages
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'ユーザーが見つかりません';
      case 'auth/wrong-password':
        return 'パスワードが正しくありません';
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています';
      case 'auth/weak-password':
        return 'パスワードが弱すぎます（6文字以上必要）';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません';
      case 'auth/operation-not-allowed':
        return 'この操作は許可されていません';
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています';
      case 'auth/too-many-requests':
        return 'リクエストが多すぎます。しばらく待ってから再試行してください';
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました';
      default:
        return '認証エラーが発生しました';
    }
  }
}

// Hook for React components to use authentication state
export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (firebaseUser) {
          // Get user profile from Firestore
          const profile = await AuthService.getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    userProfile,
    loading,
    isAdmin: userProfile?.admin || false,
    isVerified: userProfile?.verified || false,
    signIn: AuthService.signIn,
    signUp: AuthService.signUp,
    signOut: AuthService.signOut,
    sendPasswordResetEmail: AuthService.sendPasswordResetEmail,
    updateProfile: AuthService.updateUserProfile,
    getIdToken: AuthService.getIdToken
  };
}

// Note: React import is needed for the hook, add this to your imports in the actual implementation
// import React from 'react';