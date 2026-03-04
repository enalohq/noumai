import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/workspaces
 * Returns the authenticated user's workspaces (from WorkspaceMember list).
 * Response: { workspaces: [{ id, name, brandName? }] }
 * Ordered by membership createdAt so primary (first) is consistent with other APIs.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      workspace: {
        select: {
          id: true,
          name: true,
          brandName: true,
        },
      },
    },
  });

  const workspaces = memberships.map((m: { workspace: { id: string; name: string; brandName: string | null } }) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    brandName: m.workspace.brandName ?? undefined,
  }));

  return NextResponse.json({ workspaces });
}
