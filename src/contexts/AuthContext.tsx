import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase.ts';

export type UserRole = 'astronaut' | 'surgeon';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  callsignOrCredential: string;
  title: string;
}

export interface RegisterOptions {
  name: string;
  role: UserRole;
  callsignOrCredential?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const FIRESTORE_TIMEOUT_MS = 8000;

async function withFirestoreTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `FIRESTORE_UNAVAILABLE: Timed out while ${label}. Ensure Cloud Firestore Database is created and enabled in Firebase Console for project astrocare-7efd1.`
        )
      );
    }, FIRESTORE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRoleLoading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  register: (email: string, password: string, options: RegisterOptions) => Promise<UserRole>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const LEGACY_AUTH_KEYS = ['astrocare_demo_auth_role'];
const LEGACY_META_PREFIX = 'astrocare_firebase_user_meta_';

function clearCachedAuthStorage(): void {
  try {
    for (const key of LEGACY_AUTH_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LEGACY_META_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // Ignore storage access errors
  }
}

function buildAuthUser(
  fbUser: User,
  role: UserRole,
  docData?: Record<string, unknown>
): AuthUser {
  const email = fbUser.email ?? (typeof docData?.email === 'string' ? docData.email : '');
  const fallbackName = email
    ? email.split('@')[0]
    : role === 'surgeon'
      ? 'Flight Surgeon'
      : 'Astronaut';
  const docName = typeof docData?.name === 'string' ? docData.name.trim() : '';
  const name = fbUser.displayName?.trim() || docName || fallbackName;
  const docCredential =
    typeof docData?.callsignOrCredential === 'string'
      ? docData.callsignOrCredential.trim()
      : '';
  const defaultCredential =
    role === 'surgeon' ? 'Badge: NASA-FS-MEDCOM' : 'Callsign: Nova';

  return {
    id: fbUser.uid,
    name,
    email,
    role,
    callsignOrCredential: docCredential || defaultCredential,
    title:
      role === 'surgeon'
        ? 'Flight Surgeon · JSC Aerospace Medicine'
        : 'Mission Specialist / Expedition Crew',
  };
}

async function fetchUserFromFirestore(fbUser: User): Promise<AuthUser> {
  const path = `users/${fbUser.uid}`;
  const userDocRef = doc(db, 'users', fbUser.uid);

  let snap;
  try {
    snap = await withFirestoreTimeout(
      getDocFromServer(userDocRef),
      `reading role document at ${path}`
    );
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    if (code === 'unavailable' || code === 'failed-precondition') {
      try {
        snap = await withFirestoreTimeout(
          getDoc(userDocRef),
          `reading role document at ${path}`
        );
      } catch (fallbackErr) {
        handleFirestoreError(fallbackErr, OperationType.GET, path);
      }
    } else {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  if (snap.exists()) {
    const data = snap.data() as Record<string, unknown>;
    const docRole: UserRole = data.role === 'surgeon' ? 'surgeon' : 'astronaut';
    return buildAuthUser(fbUser, docRole, data);
  }

  // Least-privilege fallback if an older Auth account has no users/{uid} document yet
  console.warn(`No Firestore role document found at ${path}; defaulting to astronaut role.`);
  return buildAuthUser(fbUser, 'astronaut');
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials or create an account.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment before trying again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console (Authentication → Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network error contacting Firebase. Check your connection and try again.';
    case 'permission-denied':
      return 'Firestore permission denied while accessing users/{uid}. Check your Firestore security rules in Firebase Console.';
    default:
      if (error instanceof Error && error.message) {
        if (error.message.includes('FIRESTORE_UNAVAILABLE')) {
          return 'Cloud Firestore is disabled or unreachable in Firebase project astrocare-7efd1. Enable Firestore Database in Firebase Console and try again.';
        }
        if (
          error.message.includes('Missing or insufficient permissions') ||
          error.message.includes('permission-denied')
        ) {
          return 'Firestore permission denied while accessing your role profile (users/{uid}). Update your Firestore security rules in Firebase Console.';
        }
        return error.message;
      }
      return 'Authentication failed. Please try again.';
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

  const activeAuthActionRef = useRef<'login' | 'register' | null>(null);

  useEffect(() => {
    clearCachedAuthStorage();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (activeAuthActionRef.current !== null) {
        return;
      }

      if (!fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
        setIsRoleLoading(false);
        setIsLoading(false);
        return;
      }

      setFirebaseUser(fbUser);
      setIsRoleLoading(true);
      try {
        const resolvedUser = await fetchUserFromFirestore(fbUser);
        if (auth.currentUser?.uid !== fbUser.uid) {
          return;
        }
        setUser(resolvedUser);
        setRole(resolvedUser.role);
      } catch (err) {
        console.error('Failed to fetch user role from Firestore:', err);
        if (auth.currentUser?.uid === fbUser.uid) {
          setUser(null);
          setRole(null);
        }
      } finally {
        setIsRoleLoading(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserRole> => {
    clearCachedAuthStorage();
    setUser(null);
    setRole(null);
    setIsRoleLoading(true);
    activeAuthActionRef.current = 'login';

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const resolvedUser = await fetchUserFromFirestore(credential.user);
      setFirebaseUser(credential.user);
      setUser(resolvedUser);
      setRole(resolvedUser.role);
      return resolvedUser.role;
    } catch (err) {
      await signOut(auth).catch(() => {});
      setFirebaseUser(null);
      setUser(null);
      setRole(null);
      throw err;
    } finally {
      activeAuthActionRef.current = null;
      setIsRoleLoading(false);
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, options: RegisterOptions): Promise<UserRole> => {
      clearCachedAuthStorage();
      setUser(null);
      setRole(null);
      setIsRoleLoading(true);
      activeAuthActionRef.current = 'register';

      let createdUser: User | null = null;
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        createdUser = credential.user;
        const trimmedName = options.name.trim();
        if (trimmedName) {
          await updateProfile(credential.user, { displayName: trimmedName });
        }

        const path = `users/${credential.user.uid}`;
        try {
          await withFirestoreTimeout(
            setDoc(doc(db, 'users', credential.user.uid), {
              uid: credential.user.uid,
              email: credential.user.email ?? email.trim(),
              name: trimmedName,
              role: options.role,
              callsignOrCredential: options.callsignOrCredential?.trim() || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
            `creating role document at ${path}`
          );
        } catch (firestoreErr) {
          handleFirestoreError(firestoreErr, OperationType.CREATE, path);
        }

        const resolvedUser = await fetchUserFromFirestore(credential.user);
        setFirebaseUser(credential.user);
        setUser(resolvedUser);
        setRole(resolvedUser.role);
        return resolvedUser.role;
      } catch (err) {
        if (createdUser) {
          await createdUser.delete().catch(() => signOut(auth).catch(() => {}));
        } else {
          await signOut(auth).catch(() => {});
        }
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
        throw err;
      } finally {
        activeAuthActionRef.current = null;
        setIsRoleLoading(false);
        setIsLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setRole(null);
    setIsRoleLoading(false);
    clearCachedAuthStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        isAuthenticated: Boolean(firebaseUser && user),
        isLoading,
        isRoleLoading,
        login,
        register,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
