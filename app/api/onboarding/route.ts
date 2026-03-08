import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateStarterPrompts } from "@/lib/onboarding/generate-prompts";
import { autoFillMarket } from "@/lib/onboarding/auto-fill-market";
import { normalizeKeywords, keywordsToString } from "@/lib/onboarding/keyword-normalizer";

/**
 * GET /api/onboarding — Onboarding always uses primary workspace.
 * X-Workspace-Id / workspaceId query are accepted for consistency but ignored for scoping.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingStep: true,
      workspaces: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: {
          workspace: {
            select: {
              id: true,
              name: true,
              brandName: true,
              brandAliases: true,
              website: true,
              twitterHandle: true,
              linkedinHandle: true,
              country: true,
              industry: true,
              brandDescription: true,
              targetKeywords: true,
              starterPrompts: true,
              competitors: {
                select: { id: true, name: true, url: true, type: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = user.workspaces[0]?.workspace ?? null;

  // Generate suggested prompts from brand context (pure function, no extra DB cost)
  const suggestedPrompts = workspace?.brandName
    ? generateStarterPrompts({
        brandName: workspace.brandName ?? "",
        website: workspace.website ?? undefined,
        industry: workspace.industry ?? undefined,
        description: workspace.brandDescription ?? undefined,
        keywords: workspace.targetKeywords ?? undefined,
        competitors: workspace.competitors,
      })
    : [];

  // Parse saved starter prompts (user's confirmed selection from step 4)
  let savedStarterPrompts: string[] = [];
  if (workspace?.starterPrompts) {
    try {
      savedStarterPrompts = JSON.parse(workspace.starterPrompts);
    } catch {
      savedStarterPrompts = [];
    }
  }

  return NextResponse.json({
    onboardingCompleted: user.onboardingCompleted,
    currentStep: user.onboardingStep,
    suggestedPrompts,
    savedStarterPrompts,
    workspace: workspace
      ? {
          id: workspace.id,
          brandName: workspace.brandName ?? "",
          brandAliases: workspace.brandAliases ?? "",
          website: workspace.website ?? "",
          twitterHandle: workspace.twitterHandle ?? "",
          linkedinHandle: workspace.linkedinHandle ?? "",
          country: workspace.country ?? "",
          industry: workspace.industry ?? "",
          brandDescription: workspace.brandDescription ?? "",
          targetKeywords: workspace.targetKeywords ?? "",
          competitors: workspace.competitors,
        }
      : null,
  });
}

/**
 * PATCH /api/onboarding — Onboarding always uses primary workspace.
 * X-Workspace-Id / workspaceId query are accepted for consistency but ignored for scoping.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();

  // Resolve workspace once per request: onboarding always uses primary (do not read from body).
  // Find the user's primary workspace — create one on the fly if missing
  let membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  if (!membership) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: `${user?.name || user?.email || "My"}'s Workspace`,
        description: "Default workspace",
        members: { create: { userId, role: "owner" } },
      },
    });
    membership = { workspaceId: newWorkspace.id };
  }

  const workspaceId = membership.workspaceId;

  // Skip — mark onboarding complete from any step
  if (body.skip === true) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true, onboardingStep: 4 },
    });
    return NextResponse.json({ success: true, onboardingCompleted: true });
  }

  const { step } = body;

  if (step === 1) {
    const { brandName, brandAliases, website, twitterHandle, linkedinHandle, country } = body;
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        brandName: brandName ?? undefined,
        brandAliases: brandAliases ?? undefined,
        website: website ?? undefined,
        twitterHandle: twitterHandle ?? undefined,
        linkedinHandle: linkedinHandle ?? undefined,
        country: country ?? undefined,
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { onboardingStep: 1 } });

  } else if (step === 2) {
    const { industry, brandDescription, brandName, brandAliases, website, country } = body;
    
    // Auto-fill industry and description with a single LLM call if not provided
    let finalIndustry = industry;
    let finalDescription = brandDescription;
    
    if ((!industry || !brandDescription) && brandName) {
      const filled = await autoFillMarket({ brandName, brandAliases, website, country });
      finalIndustry = filled.industry;
      finalDescription = filled.description;
    }
    
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        industry: finalIndustry ?? undefined,
        brandDescription: finalDescription ?? undefined,
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { onboardingStep: 2 } });

  } else if (step === 3) {
    const { competitors, autoDiscover } = body;

    // Get existing workspace data for auto-discovery
    let autoDiscoveredCompetitors: Array<{ name: string; url?: string | null; type: string }> = [];

    if (autoDiscover === true) {
      try {
        // Get current workspace data for brand context
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { brandName: true, website: true, industry: true },
        });

        if (workspace?.brandName) {
          // Call competitor discovery API
          const discoverRes = await fetch(
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/competitors/discover`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                cookie: request.headers.get("cookie") || "",
              },
              body: JSON.stringify({
                brandName: workspace.brandName,
                website: workspace.website,
                industry: workspace.industry,
              }),
            }
          );

          if (discoverRes.ok) {
            const { competitors: discovered } = await discoverRes.json();
            autoDiscoveredCompetitors = discovered.map((c: { name: string; url?: string; type: string }) => ({
              name: c.name,
              url: c.url || null,
              type: c.type || "direct",
            }));
          }
        }
      } catch (error) {
        console.error("[onboarding step 3] Auto-discovery error:", error);
        // Continue without auto-discovered competitors
      }
    }

    // Merge manual and auto-discovered competitors
    const allCompetitors = [
      ...(Array.isArray(competitors) ? competitors : []),
      ...autoDiscoveredCompetitors,
    ];

    await prisma.$transaction([
      prisma.competitor.deleteMany({ where: { workspaceId } }),
      ...allCompetitors
        .filter((c: { name?: string }) => c.name?.trim())
        .map((c: { name: string; url?: string | null; type?: string }) =>
          prisma.competitor.create({
            data: {
              workspaceId,
              name: c.name.trim(),
              url: typeof c.url === "string" ? c.url.trim() : null,
              type: c.type ?? "direct",
            },
          })
        ),
      // Step 3 no longer saves keywords — step 4 does
      prisma.user.update({ where: { id: userId }, data: { onboardingStep: 3 } }),
    ]);

  } else if (step === 4) {
    const { targetKeywords } = body;

    // Normalize keywords: trim, lowercase, remove duplicates
    const normalizedKeywords = targetKeywords
      ? keywordsToString(normalizeKeywords(targetKeywords))
      : undefined;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { targetKeywords: normalizedKeywords ?? undefined },
    });
    await prisma.user.update({ where: { id: userId }, data: { onboardingStep: 4 } });

  } else if (step === 5) {
    const { prompts } = body;
    const validPrompts = Array.isArray(prompts)
      ? prompts.filter((p: unknown) => typeof p === "string" && (p as string).trim())
      : [];
    const promptsJson = JSON.stringify(validPrompts);

    // Save starterPrompts JSON (backward compat) and mark onboarding complete
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { starterPrompts: promptsJson },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true, onboardingStep: 5 },
    });

    // Also create TrackedPrompt rows (skip duplicates by checking existing text)
    if (validPrompts.length > 0) {
      const existingPrompts = await prisma.trackedPrompt.findMany({
        where: { workspaceId, deletedAt: null },
        select: { text: true },
      });
      const existingTexts = new Set(existingPrompts.map((p: { text: string }) => p.text));
      for (const text of validPrompts) {
        const trimmed = (text as string).trim();
        if (trimmed && !existingTexts.has(trimmed)) {
          await prisma.trackedPrompt.create({
            data: { workspaceId, text: trimmed },
          });
        }
      }
    }

  } else {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
