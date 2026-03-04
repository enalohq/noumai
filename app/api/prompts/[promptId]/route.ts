import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveWorkspaceId } from "@/lib/server/workspace-resolver";
import { z } from "zod";

const UpdatePromptSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  label: z.string().max(200).nullish(),
  isActive: z.boolean().optional(),
  schedule: z.enum(["none", "hourly", "daily", "weekly", "monthly"]).optional(),
});

type RouteContext = { params: Promise<{ promptId: string }> };

/**
 * PATCH /api/prompts/[promptId] — Update a tracked prompt.
 * Validates that the prompt belongs to the user's resolved workspace.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveWorkspaceId(req, session.user.id);
  if ("forbidden" in resolved) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ("noWorkspace" in resolved) {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }
  const workspaceId = resolved.workspaceId;
  const { promptId } = await context.params;

  // Verify prompt exists, belongs to this workspace, and is not soft-deleted
  const existing = await prisma.trackedPrompt.findFirst({
    where: { id: promptId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdatePromptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.text !== undefined) data.text = parsed.data.text.trim();
  if (parsed.data.label !== undefined) data.label = parsed.data.label?.trim() || null;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.schedule !== undefined) data.schedule = parsed.data.schedule;

  const prompt = await prisma.trackedPrompt.update({
    where: { id: promptId },
    data,
  });

  return NextResponse.json({
    id: prompt.id,
    text: prompt.text,
    label: prompt.label,
    isActive: prompt.isActive,
    schedule: prompt.schedule,
    lastRunAt: prompt.lastRunAt?.toISOString() ?? null,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/prompts/[promptId] — Soft-delete a tracked prompt.
 * Sets deletedAt = now(). The prompt row remains for FK integrity with ScrapeRuns.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveWorkspaceId(req, session.user.id);
  if ("forbidden" in resolved) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ("noWorkspace" in resolved) {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }
  const workspaceId = resolved.workspaceId;
  const { promptId } = await context.params;

  // Verify prompt exists and belongs to this workspace
  const existing = await prisma.trackedPrompt.findFirst({
    where: { id: promptId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  await prisma.trackedPrompt.update({
    where: { id: promptId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
