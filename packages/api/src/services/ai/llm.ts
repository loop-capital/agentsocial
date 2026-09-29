/**
 * Minimal LLM client for structured (JSON) generation.
 * Prefers Anthropic (ANTHROPIC_API_KEY), falls back to Gemini (GEMINI_API_KEY).
 */

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No LLM key configured. Set ANTHROPIC_API_KEY (preferred) or GEMINI_API_KEY in packages/api/.env.");
    this.name = "AiNotConfiguredError";
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

/** Pull a JSON object out of model text (handles ```json fences and stray prose). */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(body) as T;
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1)) as T;
    throw new Error("Model did not return valid JSON");
  }
}

async function anthropic(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw Object.assign(new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`), { status: res.status });
  }
  const json: any = await res.json();
  return (json.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
}

async function gemini(system: string, user: string, maxTokens: number): Promise<string> {
  const { generateText } = await import("../gemini.js");
  const r = await generateText(user, { systemInstruction: system, maxTokens, temperature: 0.8 });
  return r.text;
}

/** Overloaded / rate-limited / transient server errors are worth retrying; auth and bad-request errors are not. */
export function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") return status === 429 || status >= 500;
  return /fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(err instanceof Error ? err.message : "");
}

export async function withRetry<T>(fn: () => Promise<T>, opts: { attempts?: number; baseMs?: number } = {}): Promise<T> {
  const attempts = opts.attempts ?? 4;
  const baseMs = opts.baseMs ?? 1500;
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i + Math.random() * 300));
    }
  }
  throw last;
}

export async function completeJson<T>(opts: { system: string; user: string; maxTokens?: number }): Promise<T> {
  const maxTokens = opts.maxTokens ?? 4000;
  const call = process.env.ANTHROPIC_API_KEY
    ? () => anthropic(opts.system, opts.user, maxTokens)
    : process.env.GEMINI_API_KEY
      ? () => gemini(opts.system, opts.user, maxTokens)
      : null;
  if (!call) throw new AiNotConfiguredError();
  // A malformed-JSON reply is also worth one more try
  let text = await withRetry(call);
  try {
    return extractJson<T>(text);
  } catch {
    text = await withRetry(call);
    return extractJson<T>(text);
  }
}
