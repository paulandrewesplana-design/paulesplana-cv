import type { UserRole } from "../types";

/**
 * The authenticated principal, normalized across live-Firebase and demo modes.
 * `role`, `facilityId`, and `driverId` originate from Firebase Auth custom
 * claims in production (set server-side with the Admin SDK — never trusted from
 * the client).
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole | null;
  facilityId?: string;
  driverId?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** True when running against real Firebase Auth (vs. demo fallback). */
  live: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Demo-only: assume a role without a backend. No-op in live mode. */
  signInDemo: (role: UserRole) => void;
  signOut: () => Promise<void>;
}
