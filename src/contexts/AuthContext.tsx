import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserSettings } from '../types';
import { BiometricService } from '../services/biometricService';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  isLocked: boolean;
  lockApp: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupBiometrics: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  removeBiometrics: () => Promise<void>;
}

export const DEFAULT_CATEGORIES = ['Food', 'Snacks', 'Transport'];

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'UGX',
  biometricsEnabled: true,
  theme: 'light',
  categories: DEFAULT_CATEGORIES,
};

const parseBool = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'enabled';
  }
  return false;
};

const parseUserSettings = (data: any): UserSettings => {
  if (!data) return DEFAULT_SETTINGS;
  const settingsData = (data.settings && typeof data.settings === 'object') ? data.settings : data;

  const rawBio = settingsData.biometricsEnabled ??
    settingsData.biometricsEnables ??
    settingsData.biometricEnabled ??
    settingsData.isBiometricEnabled ??
    settingsData.isBiometricsEnabled ??
    data.biometricsEnabled ??
    data.biometricsEnables;

  const rawCats = settingsData.categories || data.categories;
  let parsedCategories = DEFAULT_CATEGORIES;
  if (Array.isArray(rawCats) && rawCats.length > 0) {
    const valid = rawCats.map((c: any) => String(c).trim()).filter((c: string) => c.length > 0);
    if (valid.length > 0) parsedCategories = valid;
  }

  const pin = settingsData.pinHash || settingsData.pinCode || data.pinHash || data.pinCode;

  return {
    currency: settingsData.currency || data.currency || DEFAULT_SETTINGS.currency,
    biometricsEnabled: parseBool(rawBio),
    biometricCredentialId: settingsData.biometricCredentialId || data.biometricCredentialId,
    pinCode: pin,
    theme: settingsData.theme || data.theme || DEFAULT_SETTINGS.theme,
    categories: parsedCategories,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SETTINGS_STORAGE_KEY = 'spendwise_user_settings';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState(false);

  // Load stored settings on mount or user change, and listen to Firestore updates
  useEffect(() => {
    if (!currentUser) {
      setUserSettings(DEFAULT_SETTINGS);
      setIsLocked(false);
      return;
    }

    // 1. Initial cached settings
    const stored = localStorage.getItem(`${SETTINGS_STORAGE_KEY}_${currentUser.uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const resolved = parseUserSettings(parsed);
        setUserSettings(resolved);
        if (resolved.biometricsEnabled || resolved.pinCode) {
          setIsLocked(true);
        }
      } catch {
        setUserSettings(DEFAULT_SETTINGS);
      }
    } else {
      setUserSettings(DEFAULT_SETTINGS);
    }

    // 2. Real-time Firestore user settings subscription
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const serverData = snap.data();
        const serverSettings = parseUserSettings(serverData);
        setUserSettings(serverSettings);
        localStorage.setItem(`${SETTINGS_STORAGE_KEY}_${currentUser.uid}`, JSON.stringify(serverSettings));

        // If server says biometrics/PIN is disabled, unlock immediately
        if (!serverSettings.biometricsEnabled && !serverSettings.pinCode) {
          setIsLocked(false);
        }
      }
    }, (error) => {
      console.warn('Error listening to user settings:', error);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    if (currentUser) {
      localStorage.setItem(`${SETTINGS_STORAGE_KEY}_${currentUser.uid}`, JSON.stringify(updated));
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          settings: {
            ...updated,
            pinHash: updated.pinCode || '',
          },
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.error('Failed to update user settings in Firestore:', err);
      }
    }
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in popup was closed before completing.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for OAuth in Firebase Console. Please add it in Authentication > Settings > Authorized Domains.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection.';
      default:
        return error?.message || 'Authentication error. Please try again.';
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
          photoURL: result.user.photoURL,
        });
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || email.split('@')[0],
          photoURL: result.user.photoURL,
        });
      }
    } catch (err: any) {
      console.error('Email login error:', err);
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: name || email.split('@')[0],
          photoURL: null,
        });
      }
    } catch (err: any) {
      console.error('Email signup error:', err);
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Logout warning:', e);
    }
    setCurrentUser(null);
    setIsLocked(false);
  };

  const lockApp = () => {
    if (userSettings.biometricsEnabled || userSettings.pinCode) {
      setIsLocked(true);
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const verified = await BiometricService.verifyBiometrics(userSettings.biometricCredentialId);
      if (verified) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Biometric verification failed:', e);
      return false;
    }
  };

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    if (!userSettings.pinCode) return false;
    const isValid = await BiometricService.verifyPin(pin, userSettings.pinCode);
    if (isValid) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setupBiometrics = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const credId = await BiometricService.registerBiometrics(currentUser.email || currentUser.displayName || 'user');
      await updateUserSettings({
        biometricsEnabled: true,
        biometricCredentialId: credId,
      });
      return true;
    } catch (e) {
      console.error('Failed to setup biometrics:', e);
      throw e;
    }
  };

  const setupPin = async (pin: string) => {
    const hashed = await BiometricService.hashPin(pin);
    await updateUserSettings({
      pinCode: hashed,
    });
  };

  const removeBiometrics = async () => {
    await updateUserSettings({
      biometricsEnabled: false,
      biometricCredentialId: undefined,
      pinCode: undefined,
    });
    setIsLocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseConfigured,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        userSettings,
        updateUserSettings,
        isLocked,
        lockApp,
        unlockWithBiometrics,
        unlockWithPin,
        setupBiometrics,
        setupPin,
        removeBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
