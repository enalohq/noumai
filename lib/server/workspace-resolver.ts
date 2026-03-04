import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get workspace id from request: X-Workspace-Id header or workspaceId query param.
 * Returns null if not present.
 */
export function getWorkspaceIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get("x-workspace-id")?.trim();
  if (header) return header;
  const query = req.nextUrl.searchParams.get("workspaceId")?.trim();
  if (query) return query;
  return null;
}

/**
 * Get the user's primary workspace id (first membership by createdAt).
 */
export async function getPrimaryWorkspaceId(userId: string): Promise<string | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
}

export type ResolveWorkspaceResult =
  | { workspaceId: string }
  | { forbidden: true }
  | { noWorkspace: true };

/**
 * Resolve workspace for this request: header/query + auth only.
 * - If X-Workspace-Id (or workspaceId query) is present: validate membership; return workspaceId or { forbidden: true }.
 * - If omitted: return primary workspace id, or { noWorkspace: true } if user has no workspace.
 * Use 403 when authenticated but not a member (do not use 404).
 */
export async function resolveWorkspaceId(
  req: NextRequest,
  userId: string
): Promise<ResolveWorkspaceResult> {
  const requestedId = getWorkspaceIdFromRequest(req);

  if (!requestedId) {
    const primary = await getPrimaryWorkspaceId(userId);
    if (!primary) return { noWorkspace: true };
    return { workspaceId: primary };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: requestedId },
    select: { workspaceId: true },
  });

  if (!membership) {
    return { forbidden: true };
  }

  return { workspaceId: membership.workspaceId };
}
