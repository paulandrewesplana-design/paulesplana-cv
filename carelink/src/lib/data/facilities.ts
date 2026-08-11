/**
 * Facility data access. A facility's static pickup address is locked at
 * onboarding — the booking UI treats it as read-only.
 */
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { Facility } from "../types";
import { getState } from "./store";

export async function getFacility(facilityId: string): Promise<Facility | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "facilities", facilityId));
    return snap.exists() ? (snap.data() as Facility) : null;
  }
  return getState().facilities.find((f) => f.id === facilityId) ?? null;
}
