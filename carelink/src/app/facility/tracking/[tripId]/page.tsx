import { RequireRole } from "@/components/auth/RequireRole";
import { TrackingMap } from "@/components/facility/TrackingMap";

/**
 * Live tracking route. Keyed by tripId only — never by patient identifiers —
 * to keep PHI out of URLs / logs / referrers (see HIPAA rules).
 */
export default function TrackingPage({ params }: { params: { tripId: string } }) {
  return (
    <RequireRole role="facility">
      <TrackingMap tripId={params.tripId} />
    </RequireRole>
  );
}
