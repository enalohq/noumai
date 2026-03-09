"use client";

import { useCallback, useState } from "react";
import type { AuditReport } from "@/components/dashboard/types";

interface UseAeoAuditOptions {
  disabled?: boolean;
  workspaceId?: string | null;
}

interface UseAeoAuditReturn {
  loadHistory: () => Promise<AuditReport[] | null>;
  runAudit: (url: string) => Promise<AuditReport | null>;
  loading: boolean;
  error: string | null;
}

export function useAeoAudit({
  disabled = false,
  workspaceId = null,
}: UseAeoAuditOptions = {}): UseAeoAuditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (): Promise<AuditReport[] | null> => {
    if (disabled || !workspaceId) return null;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/audit/history?workspaceId=${workspaceId}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return null;
        throw new Error(`Failed to load history (${res.status})`);
      }
      const data = await res.json();
      return (data.history ?? []) as AuditReport[];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit history");
      return null;
    } finally {
      setLoading(false);
    }
  }, [disabled, workspaceId]);

  const runAudit = useCallback(async (url: string): Promise<AuditReport | null> => {
    if (disabled) return null;

    try {
      setLoading(true);
      setError(null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (workspaceId) (headers as Record<string, string>)["X-Workspace-Id"] = workspaceId;

      const res = await fetch("/api/audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");

      return data as AuditReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed running audit");
      return null;
    } finally {
      setLoading(false);
    }
  }, [disabled, workspaceId]);

  return { loadHistory, runAudit, loading, error };
}
