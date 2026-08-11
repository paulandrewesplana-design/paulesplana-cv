/**
 * Trip request data access. Live path uses Firestore; otherwise the mock store.
 */
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { SpecialNeed, TripRequest, Urgency } from "../types";
import { generateId } from "../utils";
import { addTrip, getState, subscribe } from "./store";

export interface NewTripInput {
  facilityId: string;
  patientName: string;
  patientDOB: string;
  specialNeeds: SpecialNeed[];
  pickupAddress: string;
  dropoffAddress: string;
  urgency: Urgency;
  driverId?: string;
}

/**
 * Subscribe to a facility's trips, newest first. Returns an unsubscribe fn.
 * Mirrors Firestore `onSnapshot` semantics in both modes.
 */
export function watchFacilityTrips(
  facilityId: string,
  onData: (trips: TripRequest[]) => void,
): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, "trip_requests"),
      where("facilityId", "==", facilityId),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => d.data() as TripRequest);
      onData(rows);
    });
  }

  const read = (): void => {
    const rows = getState()
      .trips.filter((t) => t.facilityId === facilityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    onData(rows);
  };
  read();
  return subscribe(read);
}

/** Live subscription to a single trip. Returns unsubscribe. */
export function watchTrip(
  tripId: string,
  onData: (trip: TripRequest | null) => void,
): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, "trip_requests", tripId), (snap) => {
      onData(snap.exists() ? (snap.data() as TripRequest) : null);
    });
  }
  const read = (): void => {
    onData(getState().trips.find((t) => t.id === tripId) ?? null);
  };
  read();
  return subscribe(read);
}

/** Fleet-wide trip subscription for CEO analytics. Returns unsubscribe. */
export function watchAllTrips(onData: (trips: TripRequest[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, "trip_requests"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map((d) => d.data() as TripRequest));
    });
  }
  const read = (): void => {
    const rows = [...getState().trips].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    onData(rows);
  };
  read();
  return subscribe(read);
}

export async function createTrip(input: NewTripInput): Promise<TripRequest> {
  const trip: TripRequest = {
    id: generateId("trip"),
    status: "requested",
    createdAt: new Date().toISOString(),
    ...input,
  };

  if (isFirebaseConfigured && db) {
    // In production the doc id is Firestore-generated; createdAt uses the
    // server clock. We keep the same shape the app reads back.
    await addDoc(collection(db, "trip_requests"), {
      ...trip,
      createdAt: serverTimestamp(),
    });
    return trip;
  }

  addTrip(trip);
  return trip;
}
