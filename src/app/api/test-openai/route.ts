import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  try {
    const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

    console.log("[test-openai] forgeUrl:", forgeUrl?.slice(0, 30));
    console.log("[test-openai] forgeKey:", forgeKey?.slice(0, 20));

    const openai = new OpenAI({
      apiKey: forgeKey,
      baseURL: forgeUrl ? `${forgeUrl}/v1` : undefined,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 200,
      messages: [{ role: "user", content: "Say hi in 3 words" }],
    });

    console.log("[test-openai] choices:", JSON.stringify(completion.choices).slice(0, 200));
    return NextResponse.json({
      ok: true,
      response: completion.choices[0]?.message?.content,
      finish: completion.choices[0]?.finish_reason,
    });
  } catch (err: any) {
    console.error("[test-openai] Error:", err.message);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
