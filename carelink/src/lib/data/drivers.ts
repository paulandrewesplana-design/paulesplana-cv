/**
 * Driver data access, including the dispatch spatial query.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import type { Driver, GeoPoint, SpecialNeed } from "../types";
import { distanceMiles } from "../utils";
import { getState, subscribe } from "./store";

export interface NearbyDriver {
  driver: Driver;
  miles: number;
}

/**
 * Find AVAILABLE ambulances near a facility, nearest first.
 *
 * Per project rule #3, the dispatch pool is filtered on the server with an
 * explicit `where("status", "==", "available")` — drivers in service or on
 * break are never returned. Proximity ranking is applied after the fetch.
 */
export async function findAvailableDrivers(
  origin: GeoPoint,
  required?: SpecialNeed[],
): Promise<NearbyDriver[]> {
  let pool: Driver[];

  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "drivers"), where("status", "==", "available"));
    const snap = await getDocs(q);
    pool = snap.docs.map((d) => d.data() as Driver);
  } else {
    pool = getState().drivers.filter((d) => d.status === "available");
  }

  const needsVehicle = (required ?? []).find((n) =>
    ["Wheelchair", "BLS", "ALS", "Stretcher"].includes(n),
  );

  return pool
    .filter((d) => (needsVehicle ? d.vehicleType === needsVehicle : true))
    .map((driver) => ({ driver, miles: distanceMiles(origin, driver.currentGeoPoint) }))
    .sort((a, b) => a.miles - b.miles);
}

/** Live subscription to a single driver (used by the tracking view). */
export function watchDriver(
  driverId: string,
  onData: (driver: Driver | null) => void,
): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, "drivers", driverId), (snap) => {
      onData(snap.exists() ? (snap.data() as Driver) : null);
    });
  }
  const read = (): void => {
    onData(getState().drivers.find((d) => d.id === driverId) ?? null);
  };
  read();
  return subscribe(read);
}

/** Live subscription to the full fleet (used by CEO analytics). */
export function watchDrivers(onData: (drivers: Driver[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(collection(db, "drivers"), (snap) => {
      onData(snap.docs.map((d) => d.data() as Driver));
    });
  }
  const read = (): void => onData([...getState().drivers]);
  read();
  return subscribe(read);
}
