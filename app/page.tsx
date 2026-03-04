"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { SovereignDashboard } from "@/components/sovereign-dashboard";

const isDemoOnly =
  (process.env.NEXT_PUBLIC_DEMO_ONLY ?? "").trim().toLowerCase() === "true";

// Check DB for onboarding status — JWT may be stale right after completing onboarding
async function checkOnboardingComplete(): Promise<"done" | "pending" | "unauthorized"> {
  try {
    const res = await fetch("/api/onboarding");
    if (res.status === 401) return "unauthorized";
    if (!res.ok) return "pending";
    const data = await res.json();
    return data.onboardingCompleted === true ? "done" : "pending";
  } catch {
    return "done"; // Non-fatal — let the dashboard load
  }
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ready, setReady] = useState(isDemoOnly);

  useEffect(() => {
    if (status === "unauthenticated" && !isDemoOnly) {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      checkOnboardingComplete().then((result) => {
        if (result === "unauthorized") {
          // Stale session — cookie is valid but user no longer exists in DB
          import("next-auth/react").then(({ signOut }) => {
            signOut({ callbackUrl: "/auth/signin" });
          });
        } else if (result === "pending") {
          router.push("/onboarding");
        } else {
          setReady(true);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === "loading" || (!ready && !isDemoOnly)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-th-accent border-t-transparent" />
          <p className="text-sm text-th-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (isDemoOnly || (session && ready)) {
    return (
      <ErrorBoundary>
        <SovereignDashboard demoMode={isDemoOnly} />
      </ErrorBoundary>
    );
  }

  return null;
}
