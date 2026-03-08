"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadNoumAIValue, saveNoumAIValue, clearNoumAIStore } from "@/lib/client/noumai-store";
import { sanitizeCompetitor } from "@/lib/competitors/utils";
import { useServerRuns } from "@/lib/client/use-server-runs";
import { useTrackedPrompts } from "@/lib/client/use-tracked-prompts";
import { useDashboardKpis } from "@/lib/client/use-dashboard-kpis";
import {
  extractBrandTerms,
  extractCompetitorTerms,
  findMentions,
  detectSentiment,
  calcVisibilityScore,
  detectDrift,
} from "@/lib/scoring";
import { DEMO_STATE } from "@/lib/demo-data";
import { useSession, signOut } from "next-auth/react";
import { AeoAuditTab } from "@/components/dashboard/menu/aeo-audit-tab";
import { AutomationTab } from "@/components/dashboard/menu/automation-tab-v2";
import { BattlecardsTab } from "@/components/dashboard/menu/battlecards-tab";
import { CitationOpportunitiesTab } from "@/components/dashboard/menu/citation-opportunities-tab";
import { NicheExplorerTab } from "@/components/dashboard/menu/niche-explorer-tab";
import { FanOutTab } from "@/components/dashboard/menu/fan-out-tab";
import { PartnerDiscoveryTab } from "@/components/dashboard/menu/partner-discovery-tab";
import { SettingsTab } from "@/components/dashboard/menu/settings-tab";
import { PromptHubTab } from "@/components/dashboard/menu/prompt-hub-tab";
import { ReputationSourcesTab } from "@/components/dashboard/menu/reputation-sources-tab";
import { VisibilityAnalyticsTab } from "@/components/dashboard/menu/visibility-analytics-tab";
import { DocumentationTab } from "@/components/dashboard/menu/documentation-tab";
import { ScrapeProgressTracker, useScrapeTimer, type ScrapeProgress, type ProviderStatus } from "@/components/dashboard/scrape-progress-tracker";
import { ActionInsights } from "@/components/dashboard/action-insights";
import { tabIcons } from "@/components/dashboard/icons";
import { tabMeta } from "@/components/dashboard/tab-meta";
import { KpiCard, ScoreFactorCard } from "@/components/dashboard/kpi-card";
import type { AppState, Battlecard, DriftAlert, Provider, ScheduleInterval, ScrapeRun, TabKey, TrackedPrompt, Workspace } from "@/components/dashboard/types";
import { ALL_PROVIDERS, PROVIDER_LABELS, SCHEDULE_OPTIONS, tabs } from "@/components/dashboard/types";

const STORAGE_KEY = "noumai-v1";
const WORKSPACES_KEY = "noumai-workspaces";
const ACTIVE_WS_KEY = "noumai-active-workspace";
const THEME_KEY = "noumai-theme";

function storageKeyForWorkspace(wsId: string) {
  return wsId === "default" ? STORAGE_KEY : `noumai-${wsId}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const defaultState: AppState = {
  brand: {
    brandName: "",
    brandAliases: "",
    website: "",
    industry: "",
    keywords: "",
    description: "",
  },
  provider: "chatgpt",
  activeProviders: ["chatgpt"],
  prompt:
    "What is the strongest value proposition for NoumAI in 2026? Include sources.",
  customPrompts: [
    "How visible is {brand} versus competitors for enterprise AI analytics tools? Include sources.",
    "What are the top 3 reasons to choose {brand} based on trusted sources?",
  ],
  personas: "CMO\nSEO Lead\nProduct Marketing Manager\nFounder",
  fanoutPrompts: [],
  niche: "AI SEO platform for B2B SaaS",
  nicheQueries: [],
  cronExpr: "0 */6 * * *",
  githubWorkflow:
    "name: noumai\non:\n  schedule:\n    - cron: '0 */6 * * *'\njobs:\n  track:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm run test:scraper",
  competitors: [],
  battlecards: [],
  runs: [],
  auditReport: null,
  scheduleEnabled: false,
  scheduleIntervalMs: 21600000,
  lastScheduledRun: null,
  driftAlerts: [],
};

// tabMeta imported from @/components/dashboard/tab-meta

export function NoumAIDashboard({ demoMode = false }: { demoMode?: boolean } = {}) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("Prompts");
  const [state, setState] = useState<AppState>(demoMode ? DEMO_STATE : defaultState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(demoMode ? "Demo mode — read-only preview" : "");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>("default");
  const [showWsPicker, setShowWsPicker] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  // Resolved workspace id for API: real id when we have server list, else primary or null (Phase 1)
  const resolvedWorkspaceId =
    activeWsId && activeWsId !== "default" && workspaces.some((w) => w.id === activeWsId)
      ? activeWsId
      : workspaces.length > 0
        ? workspaces[0].id
        : null;

  // Server-side run persistence (Phase 1: send X-Workspace-Id when we have a resolved id)
  const { loadRuns, persistRun } = useServerRuns({
    disabled: demoMode,
    workspaceId: demoMode ? null : resolvedWorkspaceId,
  });

  // Server-backed tracked prompts (Phase 2)
  const {
    prompts: trackedPrompts,
    activePrompts,
    loadPrompts,
    addPrompt: addTrackedPrompt,
    updatePrompt: updateTrackedPrompt,
    deletePrompt: deleteTrackedPrompt,
  } = useTrackedPrompts({
    disabled: demoMode,
    workspaceId: demoMode ? null : resolvedWorkspaceId,
  });

  // Scrape progress tracking
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>({
    providers: {},
    elapsedSeconds: 0,
    active: false,
  });
  const scrapeElapsed = useScrapeTimer(scrapeProgress.active);

  // Keep progress.elapsedSeconds in sync with the timer
  useEffect(() => {
    if (scrapeProgress.active) {
      setScrapeProgress((prev) => ({ ...prev, elapsedSeconds: scrapeElapsed }));
    }
  }, [scrapeElapsed, scrapeProgress.active]);

  /** Apply theme class to <html> */
  const applyTheme = useCallback((t: "light" | "dark" | "system") => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  function cycleTheme() {
    const order: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
    applyTheme(next);
    if (!demoMode) sessionStorage.setItem(THEME_KEY, next);
  }

  /** Load workspaces on mount */
  useEffect(() => {
    // Theme
    const savedTheme = sessionStorage.getItem(THEME_KEY) as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    if (demoMode) return; // Skip workspace / API in demo mode (Phase 1)

    fetch("/api/workspaces")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { workspaces?: Array<{ id: string; name: string; brandName?: string }> } | null) => {
        const list = data?.workspaces;
        if (Array.isArray(list) && list.length > 0) {
          const serverWorkspaces: Workspace[] = list.map((w) => ({
            id: w.id,
            brandName: w.brandName ?? w.name ?? "Workspace",
            createdAt: new Date().toISOString(),
          }));
          const primaryId = serverWorkspaces[0].id;
          const savedActiveId = sessionStorage.getItem(ACTIVE_WS_KEY);
          const activeId =
            savedActiveId && serverWorkspaces.some((w) => w.id === savedActiveId)
              ? savedActiveId
              : primaryId;
          setWorkspaces(serverWorkspaces);
          setActiveWsId(activeId);
          sessionStorage.setItem(ACTIVE_WS_KEY, activeId);
          sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(serverWorkspaces));
        } else {
          try {
            const raw = sessionStorage.getItem(WORKSPACES_KEY);
            const parsed: Workspace[] = raw ? JSON.parse(raw) : [];
            if (parsed.length === 0) {
              const defaultWs: Workspace = { id: "default", brandName: "Default", createdAt: new Date().toISOString() };
              parsed.push(defaultWs);
              sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(parsed));
            }
            setWorkspaces(parsed);
            setActiveWsId(sessionStorage.getItem(ACTIVE_WS_KEY) ?? parsed[0].id);
          } catch {
            setWorkspaces([{ id: "default", brandName: "Default", createdAt: new Date().toISOString() }]);
            setActiveWsId("default");
          }
        }
      })
      .catch(() => {
        setWorkspaces([{ id: "default", brandName: "Default", createdAt: new Date().toISOString() }]);
        setActiveWsId("default");
      });
  }, [applyTheme, demoMode]);

  /** Load app state for active workspace, then hydrate brand from DB if empty */
  useEffect(() => {
    if (demoMode || !activeWsId) return;
    let mounted = true;
    const key = storageKeyForWorkspace(activeWsId);
    loadNoumAIValue<AppState>(key, defaultState).then(async (data) => {
      if (!mounted) return;

      // Merge saved state with defaults so new fields are never undefined
      const merged: AppState = {
        ...defaultState,
        ...data,
        brand: { ...defaultState.brand, ...(data.brand ?? {}) },
        provider: ALL_PROVIDERS.includes(data.provider as Provider)
          ? (data.provider as Provider)
          : defaultState.provider,
        activeProviders: Array.isArray(data.activeProviders)
          ? data.activeProviders.filter((provider): provider is Provider =>
              ALL_PROVIDERS.includes(provider as Provider),
            )
          : [],
        competitors: Array.isArray(data.competitors)
          ? data.competitors.map(sanitizeCompetitor)
          : typeof data.competitors === "string"
            ? (data.competitors as string)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map(sanitizeCompetitor)
            : [],
      };
      if (merged.activeProviders.length === 0) {
        merged.activeProviders = [merged.provider];
      }

      // If brand is empty, pull from onboarding DB data and persist to this workspace's key
      if (!merged.brand.brandName?.trim()) {
        try {
          const res = await fetch("/api/onboarding");
          if (res.ok && mounted) {
            const onboarding = await res.json();
            const ws = onboarding.workspace;
            if (ws?.brandName?.trim()) {
              merged.brand = {
                ...merged.brand,
                brandName: ws.brandName || "",
                brandAliases: ws.brandAliases || "",
                website: ws.website || "",
                industry: ws.industry || "",
                description: ws.brandDescription || "",
                keywords: ws.targetKeywords || "",
              };
              if (Array.isArray(ws.competitors)) {
                merged.competitors = ws.competitors
                  .filter((c: any) => c.name?.trim())
                  .map(sanitizeCompetitor);
              }

              // Merge savedStarterPrompts into customPrompts (deduplicated) — backward compat fallback
              // TrackedPrompts from server are the primary source (loaded separately)
              if (
                Array.isArray(onboarding.savedStarterPrompts) &&
                onboarding.savedStarterPrompts.length > 0
              ) {
                const existing = new Set(merged.customPrompts);
                const toAdd = (onboarding.savedStarterPrompts as string[]).filter(
                  (p) => p.trim() && !existing.has(p)
                );
                if (toAdd.length > 0) {
                  merged.customPrompts = [...toAdd, ...merged.customPrompts].slice(0, 50);
                }
              }

              // Persist so subsequent loads don't need the API call
              saveNoumAIValue(key, merged).catch(() => {});
            }
          }
        } catch {
          // Non-fatal — dashboard works with empty brand
        }
      }

      // Hydrate runs from server (source of truth), falling back to local cache
      if (!demoMode) {
        try {
          const serverRuns = await loadRuns();
          if (serverRuns && serverRuns.length > 0 && mounted) {
            // Server runs take precedence; merge any local-only runs by deduplicating on prompt+provider+createdAt
            const serverKeys = new Set(serverRuns.map((r) => `${r.prompt}|${r.provider}|${r.createdAt}`));
            const localOnly = merged.runs.filter((r) => !serverKeys.has(`${r.prompt}|${r.provider}|${r.createdAt}`));
            merged.runs = [...serverRuns, ...localOnly].slice(0, 500);
          }
        } catch {
          // Non-fatal — use runs from local cache
        }
      }

      if (mounted) setState(merged);

      // Load tracked prompts from server (Phase 2 — separate from AppState)
      if (!demoMode) {
        loadPrompts().catch(() => {});
      }
    });
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWsId]);

  useEffect(() => {
    if (demoMode || !activeWsId) return;
    saveNoumAIValue(storageKeyForWorkspace(activeWsId), state);
    // Update workspace brandName if changed
    if (state.brand.brandName) {
      setWorkspaces((prev) => {
        const updated = prev.map((ws) =>
          ws.id === activeWsId ? { ...ws, brandName: state.brand.brandName || ws.brandName } : ws,
        );
        sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [state, activeWsId, demoMode]);

  /** ref to the scheduler interval so we can clear/re-create it */
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** ref to latest state so the scheduler callback doesn't close over stale state */
  const stateRef = useRef(state);
  stateRef.current = state;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  /** ref to latest callScrapeOne so the scheduler callback doesn't use stale brand terms */
  const callScrapeOneRef = useRef<(prompt: string, provider: Provider, promptId?: string | null) => Promise<ScrapeRun | null>>(
    // placeholder — will be assigned after callScrapeOne is defined
    async () => null,
  );

  // detectDrift is now imported from @/lib/scoring

  /** Run a scheduled batch and detect drift */
  const runScheduledBatch = useCallback(async () => {
    const s = stateRef.current;
    if (busyRef.current) return; // skip if already running
    const prompts = activePrompts.length > 0
      ? activePrompts.map((tp) => tp.text)
      : s.customPrompts.length > 0 ? s.customPrompts : [s.prompt];
    const providers = s.activeProviders;
    if (prompts.length === 0 || providers.length === 0) return;

    setBusy(true);
    setMessage("Auto-run: Starting scheduled batch…");

    const allRuns: ScrapeRun[] = [];
    for (const prompt of prompts) {
      const results = await Promise.allSettled(
        providers.map((p) => callScrapeOneRef.current(prompt, p)),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) allRuns.push(r.value);
      }
    }

    // Detect drift against existing runs
    const newAlerts = detectDrift(allRuns, s.runs);

    setState((prev) => ({
      ...prev,
      runs: [...allRuns, ...prev.runs].slice(0, 500),
      lastScheduledRun: new Date().toISOString(),
      driftAlerts: [...newAlerts, ...prev.driftAlerts].slice(0, 100),
    }));

    setMessage(
      `Auto-run complete: ${allRuns.length} results.${newAlerts.length > 0 ? ` ${newAlerts.length} drift alert${newAlerts.length > 1 ? "s" : ""} triggered.` : ""}`,
    );
    setBusy(false);
  }, []);

  /** Set up / tear down the scheduler interval */
  useEffect(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    if (!demoMode && state.scheduleEnabled && state.scheduleIntervalMs > 0) {
      schedulerRef.current = setInterval(runScheduledBatch, state.scheduleIntervalMs);
    }
    return () => {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
    };
  }, [state.scheduleEnabled, state.scheduleIntervalMs, runScheduledBatch, demoMode]);

  function dismissAlert(id: string) {
    setState((prev) => ({
      ...prev,
      driftAlerts: prev.driftAlerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a,
      ),
    }));
  }

  function dismissAllAlerts() {
    setState((prev) => ({
      ...prev,
      driftAlerts: prev.driftAlerts.map((a) => ({ ...a, dismissed: true })),
    }));
  }

  function switchWorkspace(wsId: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    // Save current state first
    saveNoumAIValue(storageKeyForWorkspace(activeWsId), state);
    setActiveWsId(wsId);
    sessionStorage.setItem(ACTIVE_WS_KEY, wsId);
    setShowWsPicker(false);
    setMessage(`Switched to ${workspaces.find((w) => w.id === wsId)?.brandName ?? "workspace"}`);
  }

  function createWorkspace(name: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    const ws: Workspace = { id: generateId(), brandName: name, createdAt: new Date().toISOString() };
    const updated = [...workspaces, ws];
    setWorkspaces(updated);
    sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
    // Save current, switch to new
    saveNoumAIValue(storageKeyForWorkspace(activeWsId), state);
    setState({ ...defaultState, brand: { ...defaultState.brand, brandName: name } });
    setActiveWsId(ws.id);
    sessionStorage.setItem(ACTIVE_WS_KEY, ws.id);
    setShowWsPicker(false);
    setMessage(`Created workspace: ${name}`);
  }

  function deleteWorkspace(wsId: string) {
    if (demoMode) { setMessage("Demo mode — workspaces are read-only"); return; }
    if (workspaces.length <= 1) return;
    if (!window.confirm("Delete this workspace and all its data?")) return;
    const updated = workspaces.filter((w) => w.id !== wsId);
    setWorkspaces(updated);
    sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
    clearNoumAIStore(storageKeyForWorkspace(wsId));
    if (activeWsId === wsId) {
      switchWorkspace(updated[0].id);
    }
  }

  // ── KPIs (extracted to useDashboardKpis hook) ──
  const {
    totalSources,
    citationOpportunities,
    latestRun,
    runDeltas,
    movers,
    kpiVisibilityDelta,
    unreadAlertCount,
    visibilityTrend,
    partnerLeaderboard,
    brandCtx,
  } = useDashboardKpis(state);

  // ── Brand helpers (delegate to lib/scoring.ts) ──
  function getBrandTerms(): string[] {
    return extractBrandTerms(state.brand.brandName ?? "", state.brand.brandAliases ?? "");
  }

  function getCompetitorTerms(): string[] {
    return extractCompetitorTerms(state.competitors);
  }

  /** Compute website domain for scoring */
  const websiteDomain = (state.brand.website ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  /** Run a single scrape against one specific provider */
  async function callScrapeOne(prompt: string, provider: Provider, promptId?: string | null): Promise<ScrapeRun | null> {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return null; }
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          prompt,
          requireSources: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scrape request failed");

      const answerText = data.answer || "";
      const sourceList = data.sources || [];
      const brandTerms = getBrandTerms();
      const competitorTerms = getCompetitorTerms();

      const run: ScrapeRun = {
        provider: data.provider,
        prompt: data.prompt,
        promptId: promptId || null,
        answer: answerText,
        sources: sourceList,
        createdAt: data.createdAt || new Date().toISOString(),
        visibilityScore: calcVisibilityScore(answerText, sourceList, brandTerms, websiteDomain),
        sentiment: detectSentiment(answerText, brandTerms),
        brandMentions: findMentions(answerText, brandTerms),
        competitorMentions: findMentions(answerText, competitorTerms),
      };

      // Persist to server in background (fire-and-forget, non-blocking)
      persistRun(run);

      return run;
    } catch {
      return null;
    }
  }

  // Keep the ref up-to-date so the scheduler always uses latest brand/competitor terms
  callScrapeOneRef.current = callScrapeOne;

  /** Run a prompt across all activeProviders in parallel */
  async function callScrape(prompt: string) {
    const providers = state.activeProviders.length > 0
      ? state.activeProviders
      : [state.provider];
    const count = providers.length;
    setBusy(true);
    setMessage(`Running across ${count} model${count > 1 ? "s" : ""}…`);

    // Initialize progress for each provider
    const initialStatus: Record<string, ProviderStatus> = {};
    providers.forEach((p) => { initialStatus[p] = "running"; });
    setScrapeProgress({ providers: initialStatus, elapsedSeconds: 0, active: true });

    try {
      const results = await Promise.allSettled(
        providers.map(async (p) => {
          const run = await callScrapeOne(prompt, p);
          // Update this provider's status
          setScrapeProgress((prev) => ({
            ...prev,
            providers: {
              ...prev.providers,
              [p]: run ? "done" : "failed",
            },
          }));
          return run;
        }),
      );

      const runs: ScrapeRun[] = results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((r): r is ScrapeRun => r !== null);

      if (runs.length === 0) {
        setMessage("All scrape requests failed. Check your Bright Data config.");
        return;
      }

      setState((prev) => ({
        ...prev,
        runs: [...runs, ...prev.runs].slice(0, 500),
      }));

      const failed = count - runs.length;
      setMessage(
        `Done: ${runs.length}/${count} model${count > 1 ? "s" : ""} returned results.${failed > 0 ? ` ${failed} failed.` : ""}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run scraper.");
    } finally {
      setBusy(false);
      setScrapeProgress((prev) => ({ ...prev, active: false }));
    }
  }

  /** Batch run all custom prompts across all active providers */
  async function batchRunAllPrompts() {
    // Prefer server-backed active prompts; fallback to local customPrompts
    const promptItems: { text: string; promptId?: string | null }[] =
      activePrompts.length > 0
        ? activePrompts.map((tp) => ({
            text: tp.text.replace(/\{brand\}/gi, state.brand.brandName || "our brand"),
            promptId: tp.id,
          }))
        : state.customPrompts.map((p) => ({
            text: p.replace(/\{brand\}/gi, state.brand.brandName || "our brand"),
          }));

    if (promptItems.length === 0) {
      setMessage("No tracking prompts to run. Add prompts first.");
      return;
    }
    const providers = state.activeProviders.length > 0
      ? state.activeProviders
      : [state.provider];
    const totalJobs = promptItems.length * providers.length;
    setBusy(true);

    // Initialize progress — all providers start as "pending"
    const initialStatus: Record<string, ProviderStatus> = {};
    providers.forEach((p) => { initialStatus[p] = "pending"; });
    setScrapeProgress({ providers: initialStatus, elapsedSeconds: 0, active: true });

    let completed = 0;
    let failed = 0;
    const allRuns: ScrapeRun[] = [];

    for (const item of promptItems) {
      setMessage(`Batch: ${completed}/${totalJobs} done…`);

      // Mark all providers as "running" for this prompt
      setScrapeProgress((prev) => ({
        ...prev,
        providers: Object.fromEntries(
          Object.entries(prev.providers).map(([p, s]) =>
            [p, s === "done" || s === "failed" ? s : "running"] as [string, ProviderStatus]
          )
        ),
      }));

      const results = await Promise.allSettled(
        providers.map(async (p) => {
          const run = await callScrapeOne(item.text, p, item.promptId);
          setScrapeProgress((prev) => ({
            ...prev,
            providers: { ...prev.providers, [p]: run ? "done" : "failed" },
          }));
          return run;
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          allRuns.push(r.value);
          completed++;
        } else {
          failed++;
          completed++;
        }
      }

      // Reset provider statuses to "pending" for next prompt batch
      setScrapeProgress((prev) => ({
        ...prev,
        providers: Object.fromEntries(
          Object.entries(prev.providers).map(([p]) => [p, "pending"] as [string, ProviderStatus])
        ),
      }));
    }

    setState((prev) => ({
      ...prev,
      runs: [...allRuns, ...prev.runs].slice(0, 500),
    }));

    setMessage(
      `Batch complete: ${allRuns.length} results from ${promptItems.length} prompts × ${providers.length} models.${failed > 0 ? ` ${failed} failed.` : ""}`,
    );
    setBusy(false);
    setScrapeProgress((prev) => ({ ...prev, active: false }));
  }

  function generatePersonaFanout() {
    const personas = state.personas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const fanout = personas.map(
      (persona) => `${persona}: ${state.prompt} Respond with sources and direct claims first.`,
    );

    setState((prev) => ({ ...prev, fanoutPrompts: fanout }));
  }

  function addCustomPrompt(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    // Add to server-backed TrackedPrompts (Phase 2)
    addTrackedPrompt(cleaned).then((created) => {
      if (created) {
        setMessage("Tracking prompt added.");
      } else {
        // Fallback to local state if API fails
        setState((prev) => {
          if (prev.customPrompts.includes(cleaned)) return prev;
          return { ...prev, customPrompts: [cleaned, ...prev.customPrompts].slice(0, 50) };
        });
        setMessage("Tracking prompt added (locally).");
      }
    });
  }

  function removeCustomPrompt(promptIdOrText: string) {
    // Try to find and delete by TrackedPrompt id first
    const tracked = trackedPrompts.find((p) => p.id === promptIdOrText);
    if (tracked) {
      deleteTrackedPrompt(tracked.id).then((ok) => {
        if (ok) setMessage("Prompt removed.");
      });
    } else {
      // Fallback: remove from local customPrompts by text
      setState((prev) => ({
        ...prev,
        customPrompts: prev.customPrompts.filter((entry) => entry !== promptIdOrText),
      }));
    }
  }

  function extractNicheQueries(payload: unknown) {
    const data = payload as {
      text?: unknown;
      output?: unknown;
      response?: unknown;
      content?: unknown;
    };

    const directText = [data.text, data.output, data.response, data.content].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) as string | undefined;

    const raw = directText ?? "";
    // Strip markdown fences entirely
    const cleaned = raw.replace(/```[\w]*\n?/g, "").trim();

    // Try JSON array first
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]) as unknown;
        if (Array.isArray(parsed)) {
          const items = parsed
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((line) => line.length > 10)
            .slice(0, 20);
          if (items.length > 0) return items;
        }
      } catch {
        // fall through to line parsing
      }
    }

    // Line-by-line parsing
    const fromLines = cleaned
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*[-*•]\s+/, "")
          .replace(/^\s*\d+[.)]\s+/, "")
          .replace(/^\s*"|"\s*$/g, "")
          .replace(/^\*\*(.+?)\*\*$/, "$1")
          .replace(/^"+|"+$/g, "")
          .trim(),
      )
      .filter((line) => line.length > 10 && line.length < 300)
      .filter((line) => !/^(here\s+(are|is)|high[- ]intent|sure|certainly|below|the following)\b/i.test(line))
      .filter((line) => line.includes(" ")); // must have at least 2 words

    return fromLines.slice(0, 20);
  }

  async function runNicheExplorer() {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return; }
    setBusy(true);
    setMessage("Generating niche queries...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${brandCtx}Generate exactly 12 high-intent search queries that a buyer or researcher would type into an AI assistant (ChatGPT, Perplexity, Gemini) when exploring this niche: "${state.niche}".

Requirements:
- Each query should be realistic and conversational
- Include source-seeking phrasing like "with sources", "according to experts", etc.
- Mix informational, comparison, and decision-stage queries
- Return ONLY a numbered list, one query per line, no explanations`,
          maxTokens: 1500,
          skipCache: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Niche generation failed");

      const queries = extractNicheQueries(data);

      setState((prev) => ({ ...prev, nicheQueries: queries }));
      setMessage(
        queries.length > 0
          ? "Niche queries updated."
          : "No valid niche queries returned. Try a more specific niche.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed generating queries.");
    } finally {
      setBusy(false);
    }
  }

  async function runBattlecards() {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return; }
    setBusy(true);
    setMessage("Building competitor battlecards...");

    try {
      // Fetch competitors from database to get brand names
      let competitorNames: string[] = [];
      
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const onboarding = await res.json();
          const competitors = onboarding.workspace?.competitors || [];
          if (Array.isArray(competitors) && competitors.length > 0) {
            // Use competitor names from database
            competitorNames = competitors
              .filter((c: { name?: string }) => c.name?.trim())
              .map((c: { name: string }) => c.name.trim());
          }
        }
      } catch {
        // Fallback to parsing the competitors string
      }

      // If no competitors from DB, use state.competitors
      if (competitorNames.length === 0) {
        competitorNames = state.competitors.map((c) => c.name);
      }

      if (competitorNames.length === 0) {
        setMessage("Add at least one competitor first.");
        setBusy(false);
        return;
      }

      const exampleJson = JSON.stringify([
        {
          competitor: "Profound",
          sentiment: "positive",
          summary: "Strong brand presence with frequent citations.",
          sections: [
            { heading: "Strengths", points: ["High domain authority", "Frequent AI citations"] },
            { heading: "Weaknesses", points: ["Limited product range"] },
            { heading: "Pricing Insights", points: ["Premium tier: $99/mo", "Free plan available"] },
            { heading: "AI Visibility", points: ["Mentioned in 8/10 tested prompts"] },
            { heading: "Key Differentiators", points: ["Unique content optimization features"] },
          ],
        },
      ]);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${brandCtx}You are an AI search visibility analyst. Analyze how AI models (ChatGPT, Perplexity, Gemini, Copilot, Google AI, Grok) likely perceive each of these competitors: ${competitorNames.join(", ")}.

For EACH competitor, provide a JSON object with:
- "competitor": the brand name exactly as given
- "sentiment": one of "positive", "neutral", or "negative" based on likely AI recommendation tone
- "summary": 2-3 sentences overview
- "sections": an array with EXACTLY 5 objects, each with "heading" (string) and "points" (array of strings):
  1. { "heading": "Strengths", "points": [...] } — what the competitor does well in AI visibility
  2. { "heading": "Weaknesses", "points": [...] } — gaps or disadvantages
  3. { "heading": "Pricing Insights", "points": [...] } — known pricing tiers or cost perception
  4. { "heading": "AI Visibility", "points": [...] } — how often/prominently they appear in AI responses
  5. { "heading": "Key Differentiators", "points": [...] } — what sets them apart

IMPORTANT: You MUST include all 5 sections for each competitor. Each section should have 2-5 points.

Return ONLY a valid JSON array. No markdown fences. No extra text. Example format:
${exampleJson}

Now analyze all ${competitorNames.length} competitors:`,
          maxTokens: Math.max(2000, Math.min(4096, 500 * competitorNames.length)),
          temperature: 0.3,
          skipCache: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Battlecard generation failed");

      const text = String(data.text ?? "").trim();

      let parsed: Battlecard[] | null = null;

      const normalizeBattlecards = (arr: unknown): Battlecard[] => {
        if (!Array.isArray(arr)) return [];
        const mapped = arr
          .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            const competitor = String(record.competitor ?? "").trim();
            if (!competitor) return null;
            const sentimentRaw = String(record.sentiment ?? "neutral").toLowerCase();
            const sentiment = (["positive", "neutral", "negative"].includes(sentimentRaw)
              ? sentimentRaw
              : "neutral") as "positive" | "neutral" | "negative";
            const summary = String(record.summary ?? record.analysis ?? "No summary provided.").trim();
            // Parse structured sections
            const rawSections = Array.isArray(record.sections) ? record.sections : [];
            const sections = rawSections
              .map((s: unknown) => {
                const sec = (s ?? {}) as Record<string, unknown>;
                const heading = String(sec.heading ?? "").trim();
                const points = Array.isArray(sec.points) ? sec.points.map((p: unknown) => String(p).trim()).filter(Boolean) : [];
                return heading && points.length > 0 ? { heading, points } : null;
              })
              .filter((s): s is { heading: string; points: string[] } => s !== null);
            return { competitor, sentiment, summary, sections: sections.length > 0 ? sections : undefined } as Battlecard;
          });
        return mapped.filter((entry): entry is Battlecard => entry !== null);
      };

      const parseCandidate = (candidate: string): Battlecard[] => {
        try {
          return normalizeBattlecards(JSON.parse(candidate));
        } catch {
          return [];
        }
      };

      const direct = parseCandidate(text);
      if (direct.length > 0) {
        parsed = direct;
      }

      if (!parsed) {
        const noFence = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const fromNoFence = parseCandidate(noFence);
        if (fromNoFence.length > 0) parsed = fromNoFence;
      }

      if (!parsed) {
        const start = text.indexOf("[");
        if (start >= 0) {
          for (let i = text.length - 1; i > start; i -= 1) {
            if (text[i] !== "]") continue;
            const candidate = text.slice(start, i + 1);
            const maybe = parseCandidate(candidate);
            if (maybe.length > 0) {
              parsed = maybe;
              break;
            }
          }
        }
      }

      // Fallback: use raw text split by competitor names
      if (!parsed || parsed.length === 0) {
        parsed = competitorNames.map((name) => {
          // Try to find a section about this competitor in the raw text
          const namePattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          const idx = text.search(namePattern);
          const snippet = idx >= 0 ? text.slice(idx, idx + 300).replace(/[#*`]/g, "").trim() : "";
          return {
            competitor: name,
            sentiment: "neutral" as const,
            summary: snippet || `AI could not generate structured analysis. Raw response: ${text.slice(0, 200)}`,
          };
        });
      }

      setState((prev) => ({ ...prev, battlecards: parsed! }));
      setMessage(`Battlecards ready for ${parsed!.length} competitors.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed building battlecards.");
    } finally {
      setBusy(false);
    }
  }

  async function runAudit() {
    if (demoMode) { setMessage("Demo mode — API calls are disabled"); return; }
    const website = state.brand.website?.trim();
    if (!website) {
      setMessage("Add your website URL in Settings before running an audit.");
      return;
    }
    setBusy(true);
    setMessage("Running AEO audit…");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Audit failed");

      setState((prev) => ({ ...prev, auditReport: data }));
      setMessage("Audit complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed running audit.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetData() {
    if (demoMode) { setMessage("Demo mode — data cannot be modified"); return; }
    if (!window.confirm("This will delete ALL saved data (runs, prompts, settings). Continue?")) return;
    await clearNoumAIStore(storageKeyForWorkspace(activeWsId));
    setState(defaultState);
    setMessage("All data cleared.");
  }

  function renderActiveTab() {
    if (activeTab === "Settings") {
      return (
        <SettingsTab
          brand={state.brand}
          onBrandChange={(patch) =>
            setState((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }))
          }
          onReset={handleResetData}
        />
      );
    }

    if (activeTab === "Prompts") {
      return (
        <PromptHubTab
          prompts={trackedPrompts}
          customPrompts={state.customPrompts}
          brandName={state.brand.brandName}
          busy={busy}
          activeProviderCount={state.activeProviders.length}
          onAddCustomPrompt={addCustomPrompt}
          onRemoveCustomPrompt={removeCustomPrompt}
          onToggleActive={(id, isActive) => updateTrackedPrompt(id, { isActive })}
          onRunPrompt={callScrape}
          onBatchRunAll={batchRunAllPrompts}
        />
      );
    }

    if (activeTab === "Persona Fan-Out") {
      return (
        <FanOutTab
          prompt={state.prompt}
          personas={state.personas}
          fanoutPrompts={state.fanoutPrompts}
          busy={busy}
          onPromptChange={(value) => setState((prev) => ({ ...prev, prompt: value }))}
          onPersonasChange={(value) => setState((prev) => ({ ...prev, personas: value }))}
          onGenerateFanout={generatePersonaFanout}
          onRunPrompt={callScrape}
        />
      );
    }

    if (activeTab === "Prompt Explorer") {
      return (
        <NicheExplorerTab
          niche={state.niche}
          nicheQueries={state.nicheQueries}
          trackedPrompts={trackedPrompts.map((tp) => tp.text)}
          busy={busy}
          onNicheChange={(value) => setState((prev) => ({ ...prev, niche: value }))}
          onGenerateQueries={runNicheExplorer}
          onAddToTracking={addCustomPrompt}
        />
      );
    }

    if (activeTab === "Automation") {
      return (
        <AutomationTab
          scheduleEnabled={state.scheduleEnabled}
          scheduleIntervalMs={state.scheduleIntervalMs}
          lastScheduledRun={state.lastScheduledRun}
          driftAlerts={state.driftAlerts}
          busy={busy}
          onToggleSchedule={(enabled) =>
            setState((prev) => ({ ...prev, scheduleEnabled: enabled }))
          }
          onIntervalChange={(interval) =>
            setState((prev) => ({ ...prev, scheduleIntervalMs: interval }))
          }
          onRunNow={runScheduledBatch}
          onDismissAlert={dismissAlert}
          onDismissAllAlerts={dismissAllAlerts}
        />
      );
    }

    if (activeTab === "Competitor Battlecards") {
      return (
        <BattlecardsTab
          competitors={state.competitors}
          battlecards={state.battlecards}
          onCompetitorsChange={(value) => setState((prev) => ({ ...prev, competitors: value }))}
          onBuildBattlecards={runBattlecards}
          brandContext={{
            brandName: state.brand.brandName,
            website: state.brand.website,
            industry: state.brand.industry,
          }}
        />
      );
    }

    if (activeTab === "Responses") {
      return (
        <ReputationSourcesTab
          runs={state.runs}
          brandTerms={getBrandTerms()}
          competitorTerms={getCompetitorTerms()}
          runDeltas={runDeltas}
        />
      );
    }

    if (activeTab === "Visibility Analytics") {
      return <VisibilityAnalyticsTab data={visibilityTrend} runs={state.runs} />;
    }

    if (activeTab === "Citations") {
      return <PartnerDiscoveryTab partnerLeaderboard={partnerLeaderboard} brandWebsite={state.brand.website} />;
    }

    if (activeTab === "Citation Opportunities") {
      return <CitationOpportunitiesTab runs={state.runs} brandWebsite={state.brand.website} />;
    }

    if (activeTab === "Documentation") {
      return <DocumentationTab />;
    }

    return (
      <AeoAuditTab
        brandWebsite={state.brand.website || ""}
        auditReport={state.auditReport}
        onRunAudit={runAudit}
        busy={busy}
      />
    );
  }

  const themeIcon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻";

  return (
    <div className="flex h-screen overflow-hidden text-th-text">
      {/* ── Fixed sidebar ──────────────────────────────────── */}
      <aside className="flex w-[250px] shrink-0 flex-col border-r border-th-border bg-th-sidebar">
        {/* Brand / Workspace switcher */}
        <div className="border-b border-th-border px-4 py-3">
          {demoMode ? (
            <div className="flex items-center gap-2 px-1 py-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-accent">
                <span className="text-xs font-bold text-th-text-inverse">
                  {(state.brand.brandName || "AE").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-th-text">
                  {state.brand.brandName || "AEO Tracker"}
                </div>
                <div className="text-xs text-th-text-muted">Demo workspace</div>
              </div>
            </div>
          ) : (
          <>
          <button
            onClick={() => setShowWsPicker(!showWsPicker)}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-th-card-hover transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-th-accent">
              <span className="text-xs font-bold text-th-text-inverse">
                {(state.brand.brandName || "AE").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-th-text">
                {state.brand.brandName || "AEO Tracker"}
              </div>
              {state.brand.website && (
                <div className="truncate text-xs text-th-text-muted">{state.brand.website.replace(/^https?:\/\//, "")}</div>
              )}
            </div>
            <span className="text-xs text-th-text-muted">{showWsPicker ? "▲" : "▼"}</span>
          </button>

          {/* Workspace dropdown */}
          {showWsPicker && (
            <div className="mt-2 rounded-lg border border-th-border bg-th-card p-2 shadow-lg">
              <div className="mb-2 text-xs font-medium text-th-text-muted uppercase tracking-wider">Workspaces</div>
              <div className="max-h-[200px] space-y-1 overflow-auto">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex items-center gap-1">
                    <button
                      onClick={() => switchWorkspace(ws.id)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        ws.id === activeWsId
                          ? "bg-th-accent-soft text-th-text-accent font-medium"
                          : "text-th-text-secondary hover:bg-th-card-hover"
                      }`}
                    >
                      {ws.brandName || "Untitled"}
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        onClick={() => deleteWorkspace(ws.id)}
                        className="rounded p-1 text-xs text-th-text-muted hover:text-th-danger hover:bg-th-danger-soft"
                        title="Delete workspace"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* <button
                onClick={() => {
                  const name = window.prompt("Brand / workspace name:");
                  if (name?.trim()) createWorkspace(name.trim());
                }}
                className="mt-2 flex w-full items-center gap-1.5 rounded-md border border-dashed border-th-border px-2 py-1.5 text-sm text-th-text-accent hover:bg-th-accent-soft transition-colors"
                title="Workspace creation disabled until Phase 2"
              >
                <span className="text-base">+</span> New Brand
              </button> */}
            </div>
          )}
          </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            const isSettings = tab === "Settings";
            return (
              <div key={tab}>
                {isSettings && (
                  <div className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-th-text-muted">
                    Setup
                  </div>
                )}
                <button
                  title={tabMeta[tab].tooltip}
                  onClick={() => setActiveTab(tab)}
                  className={`group mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-th-accent-soft text-th-text font-medium"
                      : "text-th-text-secondary hover:bg-th-card-hover hover:text-th-text"
                  }`}
                  style={active ? { boxShadow: "inset 3px 0 0 var(--th-accent)" } : undefined}
                >
                  <span className={active ? "text-th-text-accent" : "text-th-text-muted group-hover:text-th-text-secondary"}>
                    {tabIcons[tab]}
                  </span>
                  {tabMeta[tab].title}
                  {tab === "Automation" && unreadAlertCount > 0 && (
                    <span className="ml-auto rounded-full bg-th-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
                {isSettings && (
                  <div className="mb-1 mt-2 border-t border-th-border pt-2 px-2 text-xs font-medium uppercase tracking-wider text-th-text-muted">
                    Pillars
                  </div>
                )}
              </div>
            );
          })}
        </nav>



        {/* Footer info */}
        <div className="border-t border-th-border px-4 py-3 space-y-2">
          <div className="text-center text-xs leading-relaxed text-th-text-muted">
            <div>{demoMode ? "Read-only demo" : `Local-first · ${workspaces.length} workspace${workspaces.length > 1 ? "s" : ""}`}</div>
          </div>
          
          {session && !demoMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-th-card-alt p-2">
                {session.user.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {session.user.name && (
                    <div className="truncate text-xs font-medium text-th-text">
                      {session.user.name}
                    </div>
                  )}
                  <div className="truncate text-xs text-th-text-muted">
                    {session.user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="w-full rounded-lg border border-th-border bg-th-card px-2 py-1.5 text-xs font-medium text-th-text hover:bg-th-card-hover transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Demo banner */}
        {demoMode && (
          <div className="flex shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
            <span>🎯</span>
            <span>You&apos;re viewing a read-only demo — data is pre-loaded and API calls are disabled</span>
          </div>
        )}
        {/* Toolbar */}
        <header className="flex shrink-0 items-center gap-3 border-b border-th-border bg-th-card px-5 py-2.5">
          <h1 className="mr-auto text-base font-semibold text-th-text">{tabMeta[activeTab].title}</h1>
          <label className="text-sm text-th-text-muted">Models</label>
          <div className="flex flex-wrap items-center gap-1">
            {ALL_PROVIDERS.map((p) => {
              const active = state.activeProviders.includes(p);
              return (
                <button
                  key={p}
                  onClick={() =>
                    setState((prev) => {
                      const next = active
                        ? prev.activeProviders.filter((x) => x !== p)
                        : [...prev.activeProviders, p];
                      if (next.length === 0) return prev;
                      return { ...prev, activeProviders: next, provider: next[0] };
                    })
                  }
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-th-accent text-th-text-inverse"
                      : "bg-th-card-alt text-th-text-muted hover:bg-th-card-hover hover:text-th-text-secondary"
                  }`}
                  title={active ? `Deselect ${PROVIDER_LABELS[p]}` : `Select ${PROVIDER_LABELS[p]}`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              );
            })}
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  activeProviders: prev.activeProviders.length === ALL_PROVIDERS.length ? [prev.provider] : [...ALL_PROVIDERS],
                }))
              }
              className="ml-1 rounded-md border border-th-border px-2 py-1 text-xs text-th-text-muted hover:bg-th-card-hover hover:text-th-text-secondary"
              title={state.activeProviders.length === ALL_PROVIDERS.length ? "Select only one" : "Select all models"}
            >
              {state.activeProviders.length === ALL_PROVIDERS.length ? "1" : "All"}
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="rounded-md border border-th-border px-2 py-1 text-sm hover:bg-th-card-hover transition-colors"
            title={`Theme: ${theme}`}
          >
            {themeIcon}
          </button>

          <span className={`rounded-md px-2.5 py-1 text-xs ${busy ? "animate-pulse bg-th-accent-soft text-th-text-accent" : "bg-th-card-alt text-th-text-muted"}`}>
            {message || "Ready"}
          </span>
        </header>

        {/* Scrape progress indicator */}
        <ScrapeProgressTracker progress={scrapeProgress} />

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto bg-th-bg px-5 py-4">
          {/* KPI strip — hidden on Settings */}
          <section className={`mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 ${activeTab === "Settings" ? "hidden" : ""}`}>
            <KpiCard label="Total Runs" value={state.runs.length} />
            <KpiCard
              label="Avg Visibility"
              value={
                state.runs.length > 0
                  ? `${Math.round(state.runs.reduce((a, r) => a + (r.visibilityScore ?? 0), 0) / state.runs.length)}%`
                  : "—"
              }
              delta={kpiVisibilityDelta}
              small
              onInfoClick={() => setShowScoreInfo(!showScoreInfo)}
            />
            <KpiCard
              label="Brand Mentioned"
              value={state.runs.filter((r) => (r.brandMentions?.length ?? 0) > 0).length}
            />
            <KpiCard label="Captured Sources" value={totalSources} />
            <KpiCard label="Citation Opportunities" value={citationOpportunities} />
            <KpiCard
              label="Latest Run"
              value={
                latestRun
                  ? latestRun.createdAt.replace("T", " ").slice(0, 16)
                  : "—"
              }
              small
            />
          </section>

          {/* Action Plan — insights & recommendations */}
          {activeTab !== "Settings" && activeTab !== "Prompt Explorer" && (
            <ActionInsights state={state} />
          )}

          {/* ── Movers strip ── */}
          {movers.length > 0 && activeTab !== "Settings" && (
            <section className="mb-4 rounded-xl border border-th-border bg-th-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base">📊</span>
                <h3 className="text-sm font-semibold text-th-text">Top Movers</h3>
                <span className="text-xs text-th-text-muted">Biggest visibility changes between runs</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {movers.map((m, i) => {
                  const up = m.delta > 0;
                  return (
                    <div
                      key={`${m.prompt.slice(0, 20)}-${m.provider}-${i}`}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        up
                          ? "border-th-success/30 bg-th-success-soft"
                          : "border-th-danger/30 bg-th-danger-soft"
                      }`}
                    >
                      <span className={`text-lg font-bold ${up ? "text-th-success" : "text-th-danger"}`}>
                        {up ? "↑" : "↓"}{Math.abs(m.delta)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-th-text" style={{ maxWidth: "180px" }}>
                          {m.prompt.length > 50 ? m.prompt.slice(0, 47) + "…" : m.prompt}
                        </div>
                        <div className="text-xs text-th-text-muted">
                          {PROVIDER_LABELS[m.provider]} · {m.previousScore}→{m.currentScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Scoring explanation */}
          {showScoreInfo && activeTab !== "Settings" && (
            <section className="mb-4 rounded-xl border border-th-border bg-th-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-th-text">How Visibility Scoring Works</h3>
                <button onClick={() => setShowScoreInfo(false)} className="text-th-text-muted hover:text-th-text text-lg">✕</button>
              </div>
              <p className="text-sm text-th-text-secondary mb-3">
                The visibility score (0–100) measures how prominently your brand appears in AI model responses. Each factor contributes points:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <ScoreFactorCard emoji="🔍" label="Brand Mentioned" points="+30" desc="Your brand name or alias appears in the response" />
                <ScoreFactorCard emoji="🏆" label="Prominent Position" points="+20" desc="Brand is mentioned in the first 200 characters" />
                <ScoreFactorCard emoji="🔁" label="Multiple Mentions" points="+8 to +15" desc="Brand appears 2+ times (8pts) or 3+ times (15pts)" />
                <ScoreFactorCard emoji="🔗" label="Website Cited" points="+20" desc="Your website URL appears in the cited sources" />
                <ScoreFactorCard emoji="👍" label="Positive Sentiment" points="+15" desc="Response uses positive language about your brand" />
                <ScoreFactorCard emoji="😐" label="Neutral Sentiment" points="+5" desc="Response mentions brand in a neutral context" />
              </div>
            </section>
          )}

          {/* Active tab panel */}
          <section className="rounded-xl border border-th-border bg-th-card p-5 shadow-sm">{renderActiveTab()}</section>
          <section className="mt-3 rounded-lg border border-th-border bg-th-card px-4 py-3">
            <div className="text-xs uppercase tracking-wider font-medium text-th-text-muted">What this tab does</div>
            <p className="mt-1 text-sm leading-relaxed text-th-text-secondary">{tabMeta[activeTab].details}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
