/**
 * In-memory mock store with a tiny pub/sub, used when Firebase is not
 * configured. Mirrors the shape of Firestore's `onSnapshot` so components can
 * subscribe to live updates in demo mode exactly as they would against
 * Firestore in production.
 */
import type { Driver, DriverRating, Facility, TripRequest } from "../types";
import {
  drivers as seedDrivers,
  facilities as seedFacilities,
  ratings as seedRatings,
  trips as seedTrips,
} from "../mock/seed";

interface Collections {
  facilities: Facility[];
  drivers: Driver[];
  trips: TripRequest[];
  ratings: DriverRating[];
}

type Listener = () => void;

// Deep-clone the seed so mutations during a session don't leak across reloads
// of the module in dev.
const state: Collections = {
  facilities: structuredClone(seedFacilities),
  drivers: structuredClone(seedDrivers),
  trips: structuredClone(seedTrips),
  ratings: structuredClone(seedRatings),
};

const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): Collections {
  return state;
}

export function addTrip(trip: TripRequest): void {
  state.trips = [trip, ...state.trips];
  emit();
}

export function addRating(rating: DriverRating): void {
  state.ratings = [rating, ...state.ratings];
  // Recompute the driver's rolling average.
  const driverRatings = state.ratings.filter((r) => r.driverId === rating.driverId);
  const avg =
    driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
  state.drivers = state.drivers.map((d) =>
    d.id === rating.driverId ? { ...d, ratingAverage: Number(avg.toFixed(2)) } : d,
  );
  emit();
}

export function updateTripStatus(tripId: string, status: TripRequest["status"]): void {
  state.trips = state.trips.map((t) => (t.id === tripId ? { ...t, status } : t));
  emit();
}
