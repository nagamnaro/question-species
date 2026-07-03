import { getHostedLlmConfig } from "./config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function hostedChatJson(
  messages: ChatMessage[],
): Promise<string | null> {
  const { apiKey, model, baseUrl, timeoutMs } = getHostedLlmConfig();

  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        "Hosted LLM request failed:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    return data.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Hosted LLM request timed out");
    } else {
      console.error("Hosted LLM request error:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
