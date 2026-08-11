/**
 * Cloud Firestore data models for CareLink.
 * These interfaces are the single source of truth for every document shape.
 * Per project rules: strict typing, no `any`. All reads/writes must conform.
 */

/** [lat, lng] tuple used across the platform. */
export type GeoPoint = [number, number];

export type DriverStatus = "available" | "in_service" | "on_break";
export type VehicleType = "Wheelchair" | "BLS" | "ALS" | "Stretcher";
export type Urgency = "urgent" | "today" | "scheduled";
export type TripStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "completed"
  | "canceled";

/** Special-needs tags a facility can attach to a trip request. */
export type SpecialNeed =
  | "Wheelchair"
  | "BLS"
  | "ALS"
  | "Stretcher"
  | "No Oxygen";

export type UserRole = "facility" | "driver" | "ceo";

// /facilities/{facilityId}
export interface Facility {
  id: string;
  name: string;
  staticAddress: string;
  geoPoint: GeoPoint; // [lat, lng]
}

// /drivers/{driverId}
export interface Driver {
  id: string;
  fullName: string;
  vehicleType: VehicleType;
  status: DriverStatus; // Green | Red | Yellow
  currentGeoPoint: GeoPoint;
  activeTripId?: string;
  ratingAverage: number;
}

// /trip_requests/{tripId}
export interface TripRequest {
  id: string;
  facilityId: string;
  driverId?: string;
  patientName: string;
  patientDOB: string;
  specialNeeds: SpecialNeed[];
  pickupAddress: string;
  dropoffAddress: string;
  urgency: Urgency;
  status: TripStatus;
  createdAt: string; // ISO 8601
}

// /driver_ratings/{ratingId}
export interface DriverRating {
  id: string;
  driverId: string;
  facilityId: string;
  tripId: string;
  rating: number; // 1 to 5
  feedbackText: string;
  createdAt: string; // ISO 8601
}

/**
 * PHI-safe projection of a trip for any surface where the payload might be
 * logged, cached, or placed in a URL. Patient name / DOB are deliberately
 * omitted — see HIPAA rules in the project brief.
 */
export interface TripPublicSummary {
  id: string;
  facilityId: string;
  driverId?: string;
  specialNeeds: SpecialNeed[];
  pickupAddress: string;
  dropoffAddress: string;
  urgency: Urgency;
  status: TripStatus;
  createdAt: string;
}

export function toPublicSummary(trip: TripRequest): TripPublicSummary {
  const { patientName: _n, patientDOB: _d, ...rest } = trip;
  return rest;
}
