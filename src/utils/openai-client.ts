import OpenAI from "openai";

/**
 * Create an OpenAI client that uses the direct OpenAI API key when available (Vercel),
 * and falls back to the Manus forge proxy only in the sandbox environment.
 * 
 * Priority: RECIPETOK_OPENAI_KEY > forge proxy > OPENAI_API_KEY (system, may be sandbox-only)
 */
export function createOpenAIClient() {
  const directKey = process.env.RECIPETOK_OPENAI_KEY;
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (directKey) {
    // Use direct OpenAI API — works on Vercel and anywhere
    return {
      client: new OpenAI({ apiKey: directKey }),
      model: "gpt-4o-mini",
    };
  }

  if (forgeUrl && forgeKey) {
    // Use Manus forge proxy — sandbox only
    return {
      client: new OpenAI({ apiKey: forgeKey, baseURL: `${forgeUrl}/v1` }),
      model: "gpt-5-mini",
    };
  }

  // Last resort — system OPENAI_API_KEY (may not work in all environments)
  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: "gpt-4o-mini",
  };
}
