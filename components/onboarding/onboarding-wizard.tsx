"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { DashboardPreview } from "./dashboard-preview";
import { StepBrand, type BrandData } from "./steps/step-brand";
import { StepMarket, type MarketData } from "./steps/step-market";
import { StepCompetitors, type CompetitorsData, type Competitor } from "./steps/step-competitors";
import { StepPrompts, type PromptsData } from "./steps/step-prompts";
import { useToast } from "@/components/ui/toast";

const STEPS = [
  { number: 1, title: "Your Brand", description: "Tell us about your brand" },
  { number: 2, title: "Your Market", description: "Define your industry and positioning" },
  { number: 3, title: "Track Competitors", description: "Set up competitor monitoring" },
  { number: 4, title: "Starter Prompts", description: "Choose prompts to track your AI visibility" },
];

interface OnboardingState {
  brand: BrandData;
  market: MarketData;
  competitors: CompetitorsData;
  prompts: PromptsData;
}

const DEFAULT_STATE: OnboardingState = {
  brand: { brandName: "", brandAliases: "", website: "", twitterHandle: "", linkedinHandle: "" },
  market: { industry: "", brandDescription: "" },
  competitors: { targetKeywords: "", competitors: [] },
  prompts: { selectedPrompts: [] },
};

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { showToast, ToastContainer } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load saved progress on mount
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => {
        if (r.status === 401) {
          signOut({ callbackUrl: "/auth/signin" });
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.workspace) {
          const ws = data.workspace;
          setState((s) => ({
            ...s,
            brand: {
              brandName: ws.brandName || "",
              brandAliases: ws.brandAliases || "",
              website: ws.website || "",
              twitterHandle: ws.twitterHandle || "",
              linkedinHandle: ws.linkedinHandle || "",
            },
            market: {
              industry: ws.industry || "",
              brandDescription: ws.brandDescription || "",
            },
            competitors: {
              targetKeywords: ws.targetKeywords || "",
              competitors: (ws.competitors as Competitor[]) || [],
            },
          }));
        }
        // Pre-fill saved starter prompts if returning to step 4
        if (Array.isArray(data.savedStarterPrompts) && data.savedStarterPrompts.length > 0) {
          setState((s) => ({ ...s, prompts: { selectedPrompts: data.savedStarterPrompts } }));
        }
        // Resume from last saved step
        const savedStep = data.currentStep ?? 0;
        setCurrentStep(savedStep >= 1 ? Math.min(savedStep + 1, STEPS.length) : 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveStep = async (step: number, payload: object, showNotification: boolean = true) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, ...payload }),
      });
      if (res.status === 401) {
        signOut({ callbackUrl: "/auth/signin" });
        return;
      }
      if (!res.ok) throw new Error("Failed to save");
      
      if (showNotification) {
        showToast("Progress saved", "success");
      }
    } catch (error) {
      if (showNotification) {
        showToast("Failed to save progress", "error");
      }
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Helper to get step data
  const getStepData = (step: number) => {
    switch (step) {
      case 1: return state.brand;
      case 2: return state.market;
      case 3: return state.competitors;
      case 4: return { prompts: state.prompts.selectedPrompts };
      default: return {};
    }
  };

  const handleNext = async () => {
    setError("");
    try {
      if (currentStep === 1) {
        if (!state.brand.brandName.trim() || !state.brand.website.trim()) {
          setError("Brand name and website are required.");
          return;
        }
        await saveStep(1, state.brand);
        showToast("Step 1 completed! Moving to market details.", "success");
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!state.market.industry || !state.market.brandDescription.trim()) {
          setError("Industry and brand description are required.");
          return;
        }
        await saveStep(2, state.market);
        showToast("Step 2 completed! Moving to competitor tracking.", "success");
        setCurrentStep(3);
      } else if (currentStep === 3) {
        await saveStep(3, state.competitors);
        showToast("Step 3 completed! Moving to prompt selection.", "success");
        setCurrentStep(4);
      } else if (currentStep === 4) {
        await saveStep(4, { prompts: state.prompts.selectedPrompts });
        showToast("Onboarding complete! Welcome to NoumAI.", "success", 4000);
        updateSession().catch(() => {});
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      showToast("Failed to save step", "error");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });
      showToast("Skipped onboarding. You can complete it later in settings.", "info", 4000);
      updateSession().catch(() => {});
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch {
      setError("Something went wrong.");
      showToast("Failed to skip onboarding", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-th-accent border-t-transparent" />
      </div>
    );
  }

  const currentStepMeta = STEPS[currentStep - 1];

  return (
    <>
      <ToastContainer />
      <div className="flex min-h-screen items-center justify-center bg-th-bg px-4">
        {/* Centered container — 80vw wide, 75vh tall */}
        <div
          className="flex w-full max-w-[80vw] overflow-hidden rounded-2xl border border-th-border bg-th-card shadow-2xl"
          style={{ height: "75vh", minHeight: "520px" }}
        >
        {/* Left panel — inputs */}
        <div className="flex w-[420px] shrink-0 flex-col border-r border-th-border">
          {/* Header */}
          <div className="border-b border-th-border px-7 py-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-th-text">NoumAI</span>
              <span className="rounded bg-th-accent/15 px-1.5 py-0.5 text-xs font-semibold text-th-accent">AEO</span>
            </div>
          </div>

          {/* Step progress */}
          <div className="px-7 pt-6">
            <div className="flex items-center gap-1.5">
              {STEPS.map((step, i) => (
                <div key={step.number} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      step.number < currentStep
                        ? "bg-th-accent text-white"
                        : step.number === currentStep
                        ? "border-2 border-th-accent bg-th-accent/10 text-th-accent"
                        : "border border-th-border bg-th-bg text-th-text-muted"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px w-6 transition-colors ${
                        step.number < currentStep ? "bg-th-accent" : "bg-th-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-th-text-muted">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-7 py-5">
            <div className="mb-5">
              <h1 className="text-lg font-bold text-th-text">{currentStepMeta.title}</h1>
              <p className="mt-1 text-sm text-th-text-muted">{currentStepMeta.description}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-th-danger/30 bg-th-danger-soft p-3 text-sm text-th-danger">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <StepBrand
                data={state.brand}
                oauthName={session?.user?.name || undefined}
                onChange={(brand) => setState((s) => ({ ...s, brand }))}
              />
            )}
            {currentStep === 2 && (
              <StepMarket
                data={state.market}
                onChange={(market) => setState((s) => ({ ...s, market }))}
              />
            )}
            {currentStep === 3 && (
              <StepCompetitors
                data={state.competitors}
                onChange={(competitors) => setState((s) => ({ ...s, competitors }))}
              />
            )}
            {currentStep === 4 && (
              <StepPrompts
                brandName={state.brand.brandName}
                data={state.prompts}
                onChange={(prompts) => setState((s) => ({ ...s, prompts }))}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="border-t border-th-border px-7 py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
                className="rounded-lg px-3 py-2 text-sm font-medium text-th-text-muted hover:text-th-text disabled:opacity-0 transition-colors"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={saving}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-th-text-muted hover:text-th-text transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="rounded-lg bg-th-accent px-5 py-2 text-sm font-medium text-white hover:bg-th-accent/90 disabled:opacity-50 transition-colors"
                >
                  {saving
                    ? "Saving…"
                    : currentStep === STEPS.length
                    ? "Finish setup"
                    : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — dashboard preview */}
        <div className="hidden flex-1 lg:block">
          <DashboardPreview />
        </div>
      </div>
    </div>
    </>
  );
}
