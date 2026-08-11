import { RequireRole } from "@/components/auth/RequireRole";
import { FacilityWorkspace } from "@/components/facility/FacilityWorkspace";

export default function FacilityPage() {
  return (
    <RequireRole role="facility">
      <FacilityWorkspace />
    </RequireRole>
  );
}
