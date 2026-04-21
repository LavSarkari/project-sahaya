import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (role?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile> & { displayName?: string }) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['luv.sarkari@gmail.com', 'annoyinglav@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = (email?: string | null) => {
    return email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;
  };

  const fetchProfile = async (uid: string, email?: string | null) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      if (isAdmin(email) && data.role !== 'admin') {
        await updateDoc(docRef, { role: 'admin' });
        data.role = 'admin';
      }
      setProfile(data);
    } else {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchProfile(user.uid, user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /** Google Sign-In (existing) */
  const login = async (requestedRole?: UserRole) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          role: isAdmin(user.email) ? 'admin' : (requestedRole || 'reporter'),
          name: user.displayName || 'Anonymous User',
          applicationStatus: 'none'
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      } else {
        const existingProfile = docSnap.data() as UserProfile;
        if (isAdmin(user.email) && existingProfile.role !== 'admin') {
          await updateDoc(docRef, { role: 'admin' });
          existingProfile.role = 'admin';
        }
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  };

  /** Email/Password Sign-In */
  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await fetchProfile(user.uid, user.email);
    } catch (error) {
      console.error('Email Login Error:', error);
      throw error;
    }
  };

  /** Email/Password Register */
  const registerWithEmail = async (email: string, password: string, name: string, role?: UserRole) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Set the display name on the Firebase Auth user
      await updateProfile(user, { displayName: name });

      const docRef = doc(db, 'users', user.uid);
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: isAdmin(user.email) ? 'admin' : (role || 'reporter'),
        name: name || 'Anonymous User',
        applicationStatus: 'none'
      };
      await setDoc(docRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  };

  /** Update profile data */
  const updateUserProfile = async (data: Partial<UserProfile> & { displayName?: string }) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    try {
      const updates: any = {};
      let nameUpdatedStr = undefined;

      if (data.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
        updates.name = data.displayName;
        nameUpdatedStr = data.displayName;
      }
      
      // Map other profile settings
      if (data.notificationPreferences) updates.notificationPreferences = data.notificationPreferences;
      if (data.telegramChatId !== undefined) updates.telegramChatId = data.telegramChatId;
      if (data.phone !== undefined) updates.phone = data.phone;

      if (Object.keys(updates).length > 0) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(docRef, updates);
        setProfile(prev => prev ? { ...prev, ...updates, name: nameUpdatedStr || prev.name } : null);
      }
    } catch (error) {
      console.error('Profile Update Error:', error);
      throw error;
    }
  };

  /** Update password */
  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      console.error('Password Update Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, login, loginWithEmail, registerWithEmail,
      logout, updateUserProfile, updateUserPassword, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
