import { notFound } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { BookingForm } from "@/components/facility/BookingForm";
import { TripList } from "@/components/facility/TripList";
import { getFacility } from "@/lib/data/facilities";
import { MOCK_FACILITY_ID } from "@/lib/mock/seed";

/**
 * In production the facility id comes from the authenticated user's custom
 * claims (role === "facility"). For the demo we resolve the seeded facility.
 */
export default async function FacilityPage() {
  const facility = await getFacility(MOCK_FACILITY_ID);
  if (!facility) notFound();

  return (
    <div className="min-h-screen">
      <AppHeader role="Facility" />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{facility.name}</h1>
          <p className="text-sm text-slate-500">{facility.staticAddress}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <BookingForm facility={facility} />
          <TripList facilityId={facility.id} />
        </div>
      </main>
    </div>
  );
}
