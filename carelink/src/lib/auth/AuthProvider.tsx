"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import type { UserRole } from "../types";
import { MOCK_FACILITY_ID } from "../mock/seed";
import type { AuthContextValue, AuthUser } from "./types";

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STORAGE_KEY = "carelink.demoUser";

/** Map a demo role to the identifiers a real custom-claim would carry. */
function demoUserForRole(role: UserRole): AuthUser {
  const base: AuthUser = { uid: `demo_${role}`, email: `${role}@demo.carelink`, role };
  if (role === "facility") return { ...base, facilityId: MOCK_FACILITY_ID };
  if (role === "driver") return { ...base, driverId: "drv_martinez" };
  return base;
}

function readDemoUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Coerce an unknown claim value to a valid UserRole (or null). */
function parseRole(value: unknown): UserRole | null {
  return value === "facility" || value === "driver" || value === "ceo"
    ? value
    : null;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const live = isFirebaseConfigured && auth !== null;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Live mode: subscribe to Firebase Auth and read role from custom claims.
  useEffect(() => {
    if (!live || !auth) {
      // Demo mode: hydrate any previously selected role from storage.
      setUser(readDemoUser());
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const token = await fbUser.getIdTokenResult();
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        role: parseRole(token.claims.role),
        facilityId: toStringOrUndefined(token.claims.facilityId),
        driverId: toStringOrUndefined(token.claims.driverId),
      });
      setLoading(false);
    });
    return () => unsub();
  }, [live]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (!live || !auth) {
        throw new Error(
          "Email sign-in requires Firebase configuration. Use a demo role instead.",
        );
      }
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged updates state with claims.
    },
    [live],
  );

  const signInDemo = useCallback(
    (role: UserRole): void => {
      if (live) return;
      const demo = demoUserForRole(role);
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
      setUser(demo);
    },
    [live],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (live && auth) {
      await fbSignOut(auth);
    } else if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    setUser(null);
  }, [live]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, live, signIn, signInDemo, signOut }),
    [user, loading, live, signIn, signInDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
