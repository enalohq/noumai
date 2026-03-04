import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveWorkspaceId } from "@/lib/server/workspace-resolver";
import { z } from "zod";

const MAX_RUNS_PER_WORKSPACE = 500;

const CreateRunSchema = z.object({
  provider: z.enum(["chatgpt", "perplexity", "copilot", "gemini", "google_ai", "grok"]),
  prompt: z.string().min(1),
  promptId: z.string().nullish(),
  answer: z.string(),
  sources: z.array(z.string()).default([]),
  visibilityScore: z.number().int().min(0).max(100).default(0),
  sentiment: z.enum(["positive", "neutral", "negative", "not-mentioned"]).default("not-mentioned"),
  brandMentions: z.array(z.string()).default([]),
  competitorMentions: z.array(z.string()).default([]),
});

/**
 * GET /api/runs — Load all scrape runs for the user's workspace.
 * Optional: X-Workspace-Id header or ?workspaceId= — if present, must be a workspace the user is a member of (403 otherwise).
 * If omitted, uses primary workspace.
 * Optional query params:
 *   ?limit=100       — max results (default 500)
 *   ?since=ISO8601   — only runs after this timestamp
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
    return NextResponse.json({ runs: [] });
  }
  const workspaceId = resolved.workspaceId;

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "500", 10) || 500, MAX_RUNS_PER_WORKSPACE);
  const since = searchParams.get("since");

  const where: { workspaceId: string; createdAt?: { gt: Date } } = { workspaceId };
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) {
      where.createdAt = { gt: d };
    }
  }

  const runs = await prisma.scrapeRun.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Deserialize JSON string fields back to arrays for the client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = runs.map((run: any) => ({
    id: run.id,
    promptId: run.promptId ?? null,
    provider: run.provider,
    prompt: run.prompt,
    answer: run.answer,
    sources: JSON.parse(run.sources),
    visibilityScore: run.visibilityScore,
    sentiment: run.sentiment,
    brandMentions: JSON.parse(run.brandMentions),
    competitorMentions: JSON.parse(run.competitorMentions),
    createdAt: run.createdAt.toISOString(),
  }));

  return NextResponse.json({ runs: serialized });
}

/**
 * POST /api/runs — Save a new scrape run to the database.
 * Optional: X-Workspace-Id header or ?workspaceId= — if present, must be a workspace the user is a member of (403 otherwise).
 * If omitted, uses primary workspace.
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
  const parsed = CreateRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  // Validate promptId belongs to the same workspace if provided
  let validPromptId: string | null = null;
  if (data.promptId) {
    const prompt = await prisma.trackedPrompt.findFirst({
      where: { id: data.promptId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (prompt) {
      validPromptId = prompt.id;
    }
    // If promptId doesn't match, silently ignore (don't fail the run)
  }

  const run = await prisma.scrapeRun.create({
    data: {
      workspaceId,
      promptId: validPromptId,
      provider: data.provider,
      prompt: data.prompt,
      answer: data.answer,
      sources: JSON.stringify(data.sources),
      visibilityScore: data.visibilityScore,
      sentiment: data.sentiment,
      brandMentions: JSON.stringify(data.brandMentions),
      competitorMentions: JSON.stringify(data.competitorMentions),
    },
  });

  // Enforce max runs per workspace — delete oldest if over limit
  const count = await prisma.scrapeRun.count({ where: { workspaceId } });
  if (count > MAX_RUNS_PER_WORKSPACE) {
    const oldest = await prisma.scrapeRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      take: count - MAX_RUNS_PER_WORKSPACE,
      select: { id: true },
    });
    if (oldest.length > 0) {
      await prisma.scrapeRun.deleteMany({
        where: { id: { in: oldest.map((r: { id: string }) => r.id) } },
      });
    }
  }

  return NextResponse.json({
    id: run.id,
    promptId: run.promptId,
    provider: run.provider,
    prompt: run.prompt,
    answer: run.answer,
    sources: JSON.parse(run.sources),
    visibilityScore: run.visibilityScore,
    sentiment: run.sentiment,
    brandMentions: JSON.parse(run.brandMentions),
    competitorMentions: JSON.parse(run.competitorMentions),
    createdAt: run.createdAt.toISOString(),
  });
}
