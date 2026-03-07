import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check env vars
  results.envVars = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET (" + process.env.OPENROUTER_API_KEY.slice(0, 8) + "...)" : "MISSING",
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? "SET (length: " + process.env.GMAIL_APP_PASSWORD.length + ")" : "MISSING",
  };

  // Test OpenRouter
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Odpowiedz jednym slowem: OK" }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    results.openrouter = { status: res.status, response: data.choices?.[0]?.message?.content ?? data };
  } catch (err) {
    results.openrouter = { error: String(err) };
  }

  // Test OpenRouter with plugins
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Odpowiedz jednym slowem: OK" }],
        max_tokens: 10,
        plugins: [{ id: "web" }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    results.openrouterWithPlugins = { status: res.status, response: data.choices?.[0]?.message?.content ?? data };
  } catch (err) {
    results.openrouterWithPlugins = { error: String(err) };
  }

  // Test Gmail SMTP
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    await transporter.verify();
    results.gmail = { status: "OK - connection verified" };
  } catch (err) {
    results.gmail = { error: String(err) };
  }

  // Test Instagram scrape
  try {
    const res = await fetch("https://www.instagram.com/instagram/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    results.instagram = { status: res.status, contentLength: res.headers.get("content-length") };
  } catch (err) {
    results.instagram = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
