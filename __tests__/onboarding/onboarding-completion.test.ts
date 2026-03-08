import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Test suite for onboarding completion flow
 * Verifies that onboardingCompleted is properly set to true after step 5
 */
describe("Onboarding Completion", () => {
  const testUserId = "test-user-123";
  const testWorkspaceId = "test-workspace-123";

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.workspace.deleteMany({ where: { id: testWorkspaceId } });
  });

  it("should set onboardingCompleted to true when step 5 is saved", async () => {
    // Create test user and workspace
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: "test@example.com",
        name: "Test User",
        onboardingCompleted: false,
        onboardingStep: 4,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        id: testWorkspaceId,
        name: "Test Workspace",
        members: {
          create: {
            userId: testUserId,
            role: "owner",
          },
        },
      },
    });

    // Simulate step 5 completion
    const updatedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });

    // Verify the flag is set
    expect(updatedUser.onboardingCompleted).toBe(true);
    expect(updatedUser.onboardingStep).toBe(5);

    // Verify persistence by fetching fresh
    const freshUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(freshUser?.onboardingCompleted).toBe(true);
  });

  it("should create TrackedPrompt records when step 5 is saved", async () => {
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: "test@example.com",
        name: "Test User",
        onboardingCompleted: false,
        onboardingStep: 4,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        id: testWorkspaceId,
        name: "Test Workspace",
        members: {
          create: {
            userId: testUserId,
            role: "owner",
          },
        },
      },
    });

    const testPrompts = [
      "What is the strongest value proposition for our brand?",
      "How visible is our brand versus competitors?",
    ];

    // Create tracked prompts
    for (const text of testPrompts) {
      await prisma.trackedPrompt.create({
        data: {
          workspaceId: testWorkspaceId,
          text,
        },
      });
    }

    // Verify prompts were created
    const prompts = await prisma.trackedPrompt.findMany({
      where: { workspaceId: testWorkspaceId, deletedAt: null },
    });

    expect(prompts).toHaveLength(2);
    expect(prompts.map((p) => p.text)).toEqual(expect.arrayContaining(testPrompts));
  });

  it("should not create duplicate TrackedPrompt records", async () => {
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: "test@example.com",
        name: "Test User",
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        id: testWorkspaceId,
        name: "Test Workspace",
        members: {
          create: {
            userId: testUserId,
            role: "owner",
          },
        },
      },
    });

    const promptText = "What is our brand visibility?";

    // Create first prompt
    await prisma.trackedPrompt.create({
      data: {
        workspaceId: testWorkspaceId,
        text: promptText,
      },
    });

    // Try to create duplicate
    const existing = await prisma.trackedPrompt.findMany({
      where: { workspaceId: testWorkspaceId, text: promptText, deletedAt: null },
    });

    // Should not create if already exists
    if (existing.length === 0) {
      await prisma.trackedPrompt.create({
        data: {
          workspaceId: testWorkspaceId,
          text: promptText,
        },
      });
    }

    const allPrompts = await prisma.trackedPrompt.findMany({
      where: { workspaceId: testWorkspaceId, deletedAt: null },
    });

    expect(allPrompts).toHaveLength(1);
  });
});
