import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.envVars = {
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY ? "SET (" + process.env.CEREBRAS_API_KEY.slice(0, 8) + "...)" : "MISSING",
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY ? "SET (" + process.env.GOOGLE_AI_API_KEY.slice(0, 8) + "...)" : "MISSING",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET (" + process.env.RESEND_API_KEY.slice(0, 8) + "...)" : "MISSING",
  };

  // Test Cerebras
  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b",
        messages: [{ role: "user", content: "Odpowiedz jednym slowem: OK" }],
        max_tokens: 10,
      }),
    });
    const data = await res.json();
    results.cerebras = { status: res.ok ? "OK" : "ERROR", response: data.choices?.[0]?.message?.content || data };
  } catch (err) {
    results.cerebras = { error: String(err) };
  }

  // Test Google AI
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Odpowiedz jednym slowem: OK" }],
        max_tokens: 10,
      }),
    });
    const data = await res.json();
    results.google = { status: res.ok ? "OK" : "ERROR", response: data.choices?.[0]?.message?.content || data };
  } catch (err) {
    results.google = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
