import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveWorkspaceId } from "@/lib/server/workspace-resolver";
import { z } from "zod";

const MAX_PROMPTS_PER_WORKSPACE = 100;

const CreatePromptSchema = z.object({
  text: z.string().min(1).max(2000),
  label: z.string().max(200).nullish(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/prompts — List tracked prompts for the resolved workspace.
 * Optional: X-Workspace-Id header or ?workspaceId= query param.
 * Filters out soft-deleted prompts (deletedAt IS NULL).
 * Includes lazy migration: if zero TrackedPrompts exist but starterPrompts
 * are saved on the Workspace, creates TrackedPrompt rows from them.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveWorkspaceId(req, session.user.id);
  if ("forbidden" in resolved) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ("noWorkspace" in resolved) {
    return NextResponse.json({ prompts: [] });
  }
  const workspaceId = resolved.workspaceId;

  let prompts = await prisma.trackedPrompt.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: MAX_PROMPTS_PER_WORKSPACE,
  });

  // Lazy migration: if no TrackedPrompts exist, seed from Workspace.starterPrompts
  if (prompts.length === 0) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { starterPrompts: true },
    });

    if (workspace?.starterPrompts) {
      try {
        const starterTexts: string[] = JSON.parse(workspace.starterPrompts);
        const validTexts = starterTexts.filter(
          (t) => typeof t === "string" && t.trim().length > 0
        );

        if (validTexts.length > 0) {
          // Create TrackedPrompt rows one by one (SQLite doesn't support createMany skipDuplicates)
          for (const text of validTexts) {
            await prisma.trackedPrompt.create({
              data: { workspaceId, text: text.trim() },
            });
          }

          // Re-fetch to return consistent data
          prompts = await prisma.trackedPrompt.findMany({
            where: { workspaceId, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: MAX_PROMPTS_PER_WORKSPACE,
          });
        }
      } catch {
        // starterPrompts JSON parse failed — non-fatal, return empty
      }
    }
  }

  return NextResponse.json({
    prompts: prompts.map((p: { id: string; text: string; label: string | null; isActive: boolean; schedule: string; lastRunAt: Date | null; createdAt: Date; updatedAt: Date }) => ({
      id: p.id,
      text: p.text,
      label: p.label,
      isActive: p.isActive,
      schedule: p.schedule,
      lastRunAt: p.lastRunAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

/**
 * POST /api/prompts — Create a new tracked prompt.
 * Optional: X-Workspace-Id header or ?workspaceId= query param.
 */
export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const parsed = CreatePromptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 }
    );
  }

  // Enforce max prompts per workspace
  const count = await prisma.trackedPrompt.count({
    where: { workspaceId, deletedAt: null },
  });
  if (count >= MAX_PROMPTS_PER_WORKSPACE) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PROMPTS_PER_WORKSPACE} prompts per workspace reached` },
      { status: 400 }
    );
  }

  const prompt = await prisma.trackedPrompt.create({
    data: {
      workspaceId,
      text: parsed.data.text.trim(),
      label: parsed.data.label?.trim() || null,
      isActive: parsed.data.isActive,
    },
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
  }, { status: 201 });
}
