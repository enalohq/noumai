"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }
    if (status === "authenticated" && session?.user?.onboardingCompleted) {
      router.replace("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-th-accent border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;
  if (session?.user?.onboardingCompleted) return null;

  return <OnboardingWizard />;
}
