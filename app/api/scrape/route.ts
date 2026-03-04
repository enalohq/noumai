import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAiScraper } from "@/lib/server/brightdata-scraper";

const InputSchema = z.object({
  provider: z.enum([
    "chatgpt",
    "perplexity",
    "copilot",
    "gemini",
    "google_ai",
    "grok",
  ]),
  prompt: z.string().min(3),
  requireSources: z.boolean().optional(),
  country: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API/SCRAPE] Request Body:", JSON.stringify(body, null, 2));

    const parsed = InputSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[API/SCRAPE] Validation Error:", parsed.error.format());
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    console.log("[API/SCRAPE] Validated Input:", parsed.data);
    const result = await runAiScraper(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API/SCRAPE] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 }); // Changed to 500 for non-validation errors
  }
}
