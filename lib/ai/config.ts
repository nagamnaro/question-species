export interface HostedLlmConfig {
  apiKey: string | null;
  model: string;
  baseUrl: string;
  timeoutMs: number;
}

export function getHostedLlmConfig(): HostedLlmConfig {
  return {
    apiKey: process.env.GROQ_API_KEY ?? null,
    model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    baseUrl: "https://api.groq.com/openai/v1",
    timeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 30_000),
  };
}

export function isHostedLlmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}
