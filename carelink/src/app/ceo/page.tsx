import { AppHeader } from "@/components/ui/AppHeader";
import { CeoDashboard } from "@/components/ceo/CeoDashboard";

export default function CeoPage() {
  return (
    <div className="min-h-screen">
      <AppHeader role="CEO / Fleet Admin" />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <CeoDashboard />
      </main>
    </div>
  );
}
