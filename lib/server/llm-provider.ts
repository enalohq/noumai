/**
 * LLM Provider — Ollama (primary) → OpenRouter (fallback)
 *
 * Provides a unified `callLlm()` function for text generation.
 * Used by /api/analyze for battlecards, niche explorer, persona fanout.
 *
 * Fallback behavior:
 * - If OLLAMA_BASE_URL is set → try Ollama first
 * - If Ollama fails or is not configured → fall back to OpenRouter
 * - If both fail → throw
 */

import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export interface LlmRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmResponse {
  text: string;
  provider: "ollama" | "openrouter";
}

// ── Helpers ──

/** Extract plain text from a LangChain AIMessage content field */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" && part !== null && "text" in part,
      )
      .map((part) => part.text)
      .join("");
  }
  return "";
}

// ── Ollama ──

async function tryOllama(request: LlmRequest): Promise<LlmResponse | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) return null;

  try {
    // Build headers — Ollama Cloud requires Bearer auth
    const apiKey = process.env.OLLAMA_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const model = new ChatOllama({
      baseUrl,
      model: process.env.OLLAMA_MODEL || "llama3.1",
      temperature: request.temperature ?? 0.2,
      numPredict: request.maxTokens ?? 900,
      think: true, // Required for models like minimax-m2.5 that use thinking mode
      headers,
    });

    const response = await model.invoke([new HumanMessage(request.prompt)], {
      signal: AbortSignal.timeout(60_000),
    });

    let text = extractText(response.content).trim();

    // Fallback: if content is empty, check for thinking output (some models
    // like minimax-m2.5 put the actual answer in the thinking field)
    if (!text) {
      const thinking = (response.additional_kwargs as Record<string, unknown>)?.thinking;
      if (typeof thinking === "string") text = thinking.trim();
    }

    if (!text) {
      console.warn("[LLM] Ollama returned empty response, falling back");
      return null;
    }

    return { text, provider: "ollama" };
  } catch (error) {
    console.warn(
      "[LLM] Ollama failed, falling back to OpenRouter:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// ── OpenRouter ──

async function tryOpenRouter(request: LlmRequest): Promise<LlmResponse | null> {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) return null;

  // Guard against placeholder keys left over from .env templates
  if (apiKey.startsWith("your_") || apiKey === "sk-or-placeholder" || apiKey.length < 20) {
    console.warn(
      "[LLM] OPENROUTER_KEY appears to be a placeholder — skipping OpenRouter. " +
      "Set a real API key from https://openrouter.ai/keys in your .env file.",
    );
    return null;
  }

  try {
    const model = new ChatOpenAI({
      apiKey,
      modelName: "moonshotai/kimi-k2.5",
      maxTokens: request.maxTokens ?? 900,
      temperature: request.temperature ?? 0.2,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || 
                         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
          "X-Title": "AEO Tracker",
        },
      },
    });

    const response = await model.invoke([new HumanMessage(request.prompt)]);

    const text = extractText(response.content).trim();
    if (!text) return null;

    return { text, provider: "openrouter" };
  } catch (error) {
    console.error(
      "[LLM] OpenRouter failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// ── Public API ──

/**
 * Call an LLM with automatic fallback.
 * Tries Ollama first (if configured), then OpenRouter.
 *
 * @throws Error if both providers fail or are unconfigured.
 */
export async function callLlm(request: LlmRequest): Promise<LlmResponse> {
  // 1. Try Ollama
  const ollamaResult = await tryOllama(request);
  if (ollamaResult) return ollamaResult;

  // 2. Fallback to OpenRouter
  const openRouterResult = await tryOpenRouter(request);
  if (openRouterResult) return openRouterResult;

  // 3. Both failed
  const configured: string[] = [];
  if (process.env.OLLAMA_BASE_URL) configured.push("Ollama");
  if (process.env.OPENROUTER_KEY) configured.push("OpenRouter");

  if (configured.length === 0) {
    throw new Error(
      "No LLM provider configured. Set OLLAMA_BASE_URL and/or OPENROUTER_KEY in .env",
    );
  }

  throw new Error(
    `All LLM providers failed (tried: ${configured.join(", ")}). Check server logs.`,
  );
}
