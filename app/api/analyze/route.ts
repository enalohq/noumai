import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLlm } from "@/lib/server/llm-provider";

const bodySchema = z.object({
  prompt: z.string().min(5),
  maxTokens: z.number().int().min(128).max(8192).optional(),
  temperature: z.number().min(0).max(1.5).optional(),
  skipCache: z.boolean().optional(),
});

const cache = new Map<string, { expiresAt: number; text: string }>();

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate input
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { prompt, maxTokens, temperature, skipCache } = parsed.data;

    // 2. Check cache
    const cacheKey = JSON.stringify({ prompt, maxTokens, temperature });
    if (!skipCache) {
      const hit = cache.get(cacheKey);
      if (hit && hit.expiresAt > Date.now()) {
        return NextResponse.json({ text: hit.text, cached: true });
      }
    } else {
      cache.delete(cacheKey);
    }

    // 3. Call LLM (Ollama primary → OpenRouter fallback)
    const result = await callLlm({ prompt, maxTokens, temperature });

    // 4. Cache for 30 minutes
    cache.set(cacheKey, {
      text: result.text,
      expiresAt: Date.now() + 1000 * 60 * 30,
    });

    return NextResponse.json({
      text: result.text,
      cached: false,
      llmProvider: result.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
