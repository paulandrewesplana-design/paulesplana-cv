import { TrackingMap } from "@/components/facility/TrackingMap";

/**
 * Live tracking route. Keyed by tripId only — never by patient identifiers —
 * to keep PHI out of URLs / logs / referrers (see HIPAA rules).
 */
export default function TrackingPage({ params }: { params: { tripId: string } }) {
  return <TrackingMap tripId={params.tripId} />;
}
