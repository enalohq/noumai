"use client";

import { useCallback, useState } from "react";
import type { TrackedPrompt } from "@/components/dashboard/types";

/**
 * Custom hook for server-backed tracked prompts CRUD.
 *
 * - Fetches prompts from `/api/prompts` with X-Workspace-Id
 * - Provides add / update / delete functions that call the API then refresh
 * - Filters out inactive prompts for batch runs via `activePrompts`
 */

interface UseTrackedPromptsOptions {
  disabled?: boolean;
  workspaceId?: string | null;
}

interface UseTrackedPromptsReturn {
  prompts: TrackedPrompt[];
  /** Only prompts with isActive === true */
  activePrompts: TrackedPrompt[];
  loading: boolean;
  error: string | null;
  /** Fetch prompts from the server */
  loadPrompts: () => Promise<TrackedPrompt[]>;
  /** Create a new prompt */
  addPrompt: (text: string, label?: string) => Promise<TrackedPrompt | null>;
  /** Update an existing prompt */
  updatePrompt: (id: string, data: Partial<Pick<TrackedPrompt, "text" | "label" | "isActive" | "schedule">>) => Promise<TrackedPrompt | null>;
  /** Soft-delete a prompt */
  deletePrompt: (id: string) => Promise<boolean>;
}

export function useTrackedPrompts({
  disabled = false,
  workspaceId = null,
}: UseTrackedPromptsOptions = {}): UseTrackedPromptsReturn {
  const [prompts, setPrompts] = useState<TrackedPrompt[]>([]);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback((): HeadersInit => {
    const h: Record<string, string> = {};
    if (workspaceId) h["X-Workspace-Id"] = workspaceId;
    return h;
  }, [workspaceId]);

  const loadPrompts = useCallback(async (): Promise<TrackedPrompt[]> => {
    if (disabled) return [];

    try {
      setError(null);
      const res = await fetch("/api/prompts", { headers: headers() });

      if (res.status === 401) return [];
      if (res.status === 403) {
        setError("Forbidden");
        return [];
      }
      if (!res.ok) {
        setError(`Failed to load prompts (${res.status})`);
        return [];
      }

      const data = await res.json();
      const list = (data.prompts as TrackedPrompt[]) ?? [];
      setPrompts(list);
      return list;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompts");
      return [];
    } finally {
      setLoading(false);
    }
  }, [disabled, headers]);

  const addPrompt = useCallback(async (text: string, label?: string): Promise<TrackedPrompt | null> => {
    if (disabled) return null;

    try {
      setError(null);
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ text, label: label || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to add prompt (${res.status})`);
        return null;
      }

      const created = await res.json() as TrackedPrompt;
      setPrompts((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add prompt");
      return null;
    }
  }, [disabled, headers]);

  const updatePrompt = useCallback(async (
    id: string,
    data: Partial<Pick<TrackedPrompt, "text" | "label" | "isActive" | "schedule">>
  ): Promise<TrackedPrompt | null> => {
    if (disabled) return null;

    try {
      setError(null);
      const res = await fetch(`/api/prompts/${id}`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to update prompt (${res.status})`);
        return null;
      }

      const updated = await res.json() as TrackedPrompt;
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update prompt");
      return null;
    }
  }, [disabled, headers]);

  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    if (disabled) return false;

    try {
      setError(null);
      const res = await fetch(`/api/prompts/${id}`, {
        method: "DELETE",
        headers: headers(),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to delete prompt (${res.status})`);
        return false;
      }

      setPrompts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete prompt");
      return false;
    }
  }, [disabled, headers]);

  const activePrompts = prompts.filter((p) => p.isActive);

  return { prompts, activePrompts, loading, error, loadPrompts, addPrompt, updatePrompt, deletePrompt };
}
