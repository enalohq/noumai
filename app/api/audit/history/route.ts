import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AuditReport } from "@/components/dashboard/types";

/**
 * GET /api/audit/history?workspaceId=...
 * Retrieves the last 20 AEO audits for a specific workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspaceId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const audits = await prisma.aeoAudit.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Map back to the format expected by the frontend
    const history = audits.map((a) => {
      const report = a.report as unknown as AuditReport;
      return {
        ...report,
        id: a.id,
        createdAt: a.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
