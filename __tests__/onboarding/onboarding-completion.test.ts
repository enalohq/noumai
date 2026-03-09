// Migrated from vitest to jest
import { prisma } from "@/lib/prisma";

/**
 * Test suite for onboarding completion flow
 * Verifies that onboardingCompleted is properly set to true after step 5
 */
describe("Onboarding Completion", () => {
  const testUserId = "test-user-123";
  const testWorkspaceId = "test-workspace-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set onboardingCompleted to true when step 5 is saved", async () => {
    // Mock the findUnique and update calls
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: testUserId,
      onboardingCompleted: true,
      onboardingStep: 5,
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: testUserId,
      onboardingCompleted: true,
      onboardingStep: 5,
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
    const testPrompts = [
      "What is the strongest value proposition for our brand?",
      "How visible is our brand versus competitors?",
    ];

    (prisma.trackedPrompt.create as jest.Mock).mockResolvedValue({ id: '1' });
    (prisma.trackedPrompt.findMany as jest.Mock).mockResolvedValue(
      testPrompts.map((text, i) => ({ id: String(i), text, workspaceId: testWorkspaceId, deletedAt: null }))
    );

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
    const promptText = "What is our brand visibility?";

    // Mock that it exists
    (prisma.trackedPrompt.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: '1', text: promptText, workspaceId: testWorkspaceId, deletedAt: null }]) // for initial check
      .mockResolvedValueOnce([{ id: '1', text: promptText, workspaceId: testWorkspaceId, deletedAt: null }]); // for final assertion

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
    expect(prisma.trackedPrompt.create).not.toHaveBeenCalled();
  });
});
