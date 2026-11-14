import OpenAI from "openai";

export type AIProvider = "openai" | "gemini";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

/**
 * Determine which AI provider to use:
 * 1. Checks AI_PROVIDER env variable ("openai" or "gemini")
 * 2. If not set, checks AI_MODEL or OPENAI_MODEL/GEMINI_MODEL
 * 3. Defaults to "openai"
 */
export function getAIProvider(): AIProvider {
  const envProvider = process.env.AI_PROVIDER?.toLowerCase()?.trim();
  if (envProvider === "gemini") return "gemini";
  if (envProvider === "openai") return "openai";

  // Check model hints if AI_PROVIDER is not explicitly specified
  const generalModel = (process.env.AI_MODEL || "").toLowerCase();
  if (generalModel.startsWith("gemini")) return "gemini";
  if (generalModel.startsWith("gpt")) return "openai";

  // If GEMINI_API_KEY is present and OPENAI_API_KEY is not, use gemini
  if (process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return "gemini";
  }

  return "openai";
}

/**
 * Get the active AI configuration (provider, model, apiKey).
 */
export function getAIConfig(): AIConfig {
  const provider = getAIProvider();

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please set GEMINI_API_KEY in your .env file or switch AI_PROVIDER=openai."
      );
    }
    const model =
      process.env.GEMINI_MODEL ||
      process.env.AI_MODEL ||
      "gemini-2.5-flash";

    return { provider: "gemini", model, apiKey };
  }

  // OpenAI Provider
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please set OPENAI_API_KEY in your .env file or switch AI_PROVIDER=gemini."
    );
  }
  const model =
    process.env.OPENAI_MODEL ||
    process.env.AI_MODEL ||
    "gpt-4o";

  return { provider: "openai", model, apiKey };
}

/**
 * Execute chat completion using either OpenAI or Gemini.
 */
export async function completeChat(params: {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const config = getAIConfig();

  if (config.provider === "gemini") {
    return await completeWithGemini(config, params);
  }

  return await completeWithOpenAI(config, params);
}

/**
 * OpenAI Chat Completion implementation.
 */
async function completeWithOpenAI(
  config: AIConfig,
  params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    ...(params.jsonMode && { response_format: { type: "json_object" } }),
    temperature: params.temperature ?? 0.3,
    max_tokens: params.maxTokens ?? 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}

/**
 * Gemini completion implementation.
 * Attempts Google's official OpenAI-compatible endpoint first;
 * falls back to Google's native REST generateContent API if needed.
 */
async function completeWithGemini(
  config: AIConfig,
  params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      ...(params.jsonMode && { response_format: { type: "json_object" } }),
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) return content;
  } catch (error) {
    console.warn("Gemini OpenAI-compatible endpoint error, attempting native REST fallback:", error);
  }

  // Fallback to Google Gemini Native REST API
  return await completeWithGeminiNativeRest(config, params);
}

/**
 * Direct Gemini REST API fallback.
 */
async function completeWithGeminiNativeRest(
  config: AIConfig,
  params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: params.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: params.temperature ?? 0.3,
        maxOutputTokens: params.maxTokens ?? 2000,
        ...(params.jsonMode && { responseMimeType: "application/json" }),
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

/**
 * Backward compatibility helpers
 */
export function getOpenAIClient(): OpenAI {
  const { apiKey } = getAIConfig();
  return new OpenAI({ apiKey });
}

export function getModelName(): string {
  return getAIConfig().model;
}
