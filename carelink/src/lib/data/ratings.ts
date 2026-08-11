/**
 * Driver rating data access.
 */
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { DriverRating } from "../types";
import { generateId } from "../utils";
import { addRating, getState, subscribe } from "./store";

export interface NewRatingInput {
  driverId: string;
  facilityId: string;
  tripId: string;
  rating: number; // 1..5
  feedbackText: string;
}

export function watchRatings(onData: (ratings: DriverRating[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(collection(db, "driver_ratings"), (snap) => {
      onData(snap.docs.map((d) => d.data() as DriverRating));
    });
  }
  const read = (): void => onData([...getState().ratings]);
  read();
  return subscribe(read);
}

export async function createRating(input: NewRatingInput): Promise<DriverRating> {
  const clamped = Math.max(1, Math.min(5, Math.round(input.rating)));
  const record: DriverRating = {
    id: generateId("rat"),
    createdAt: new Date().toISOString(),
    ...input,
    rating: clamped,
  };

  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, "driver_ratings"), {
      ...record,
      createdAt: serverTimestamp(),
    });
    return record;
  }

  addRating(record);
  return record;
}
