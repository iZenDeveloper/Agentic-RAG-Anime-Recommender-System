import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-[var(--muted)]">
          ShadowPulse…
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
