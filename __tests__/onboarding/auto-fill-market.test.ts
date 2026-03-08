import { autoFillMarket } from "@/lib/onboarding/auto-fill-market";
import { callLlm } from "@/lib/server/llm-provider";

jest.mock("@/lib/server/llm-provider");

describe("autoFillMarket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include website and country in the LLM prompt", async () => {
    const mockCallLlm = callLlm as jest.MockedFunction<typeof callLlm>;
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Beauty / Personal Care\nDESCRIPTION: A cosmetics brand specializing in natural skincare products.",
      provider: "ollama",
    });

    await autoFillMarket({
      brandName: "Minimalist",
      brandAliases: "Minimalist Skincare",
      website: "https://minimalist.co",
      country: "India",
    });

    expect(mockCallLlm).toHaveBeenCalledTimes(1);
    const callArgs = mockCallLlm.mock.calls[0][0];
    
    // Verify the prompt includes website and country
    expect(callArgs.prompt).toContain("https://minimalist.co");
    expect(callArgs.prompt).toContain("India");
    expect(callArgs.prompt).toContain("Minimalist");
  });

  it("should generate different descriptions for different brands", async () => {
    const mockCallLlm = callLlm as jest.MockedFunction<typeof callLlm>;

    // First brand
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Beauty / Personal Care\nDESCRIPTION: A cosmetics brand specializing in natural skincare.",
      provider: "ollama",
    });

    const result1 = await autoFillMarket({
      brandName: "Minimalist",
      website: "https://minimalist.co",
      country: "India",
    });

    // Second brand
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Fashion / Apparel / Luxury\nDESCRIPTION: A luxury fashion brand known for premium clothing.",
      provider: "ollama",
    });

    const result2 = await autoFillMarket({
      brandName: "Gucci",
      website: "https://gucci.com",
      country: "Italy",
    });

    // Verify different results
    expect(result1.industry).toBe("Beauty / Personal Care");
    expect(result1.description).toContain("cosmetics");
    
    expect(result2.industry).toBe("Fashion / Apparel / Luxury");
    expect(result2.description).toContain("luxury");
  });

  it("should handle missing website and country gracefully", async () => {
    const mockCallLlm = callLlm as jest.MockedFunction<typeof callLlm>;
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Other\nDESCRIPTION: A brand with limited information.",
      provider: "ollama",
    });

    const result = await autoFillMarket({
      brandName: "TestBrand",
    });

    expect(result.industry).toBe("Other");
    expect(result.description).toContain("limited");
    
    // Verify the prompt was still called
    expect(mockCallLlm).toHaveBeenCalledTimes(1);
  });

  it("should validate industry against known industries", async () => {
    const mockCallLlm = callLlm as jest.MockedFunction<typeof callLlm>;
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Beauty / Personal Care\nDESCRIPTION: A skincare brand.",
      provider: "ollama",
    });

    const result = await autoFillMarket({
      brandName: "SkinCare Co",
    });

    // Should match the exact industry from the list
    expect(result.industry).toBe("Beauty / Personal Care");
  });

  it("should fallback to returned industry if not in known list", async () => {
    const mockCallLlm = callLlm as jest.MockedFunction<typeof callLlm>;
    mockCallLlm.mockResolvedValueOnce({
      text: "INDUSTRY: Unknown Industry\nDESCRIPTION: A brand in an unknown industry.",
      provider: "ollama",
    });

    const result = await autoFillMarket({
      brandName: "UnknownBrand",
    });

    // Should use the returned value if not in known list
    expect(result.industry).toBe("Unknown Industry");
  });
});
