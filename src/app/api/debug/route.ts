import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Check env vars
  results.envVars = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET (" + process.env.OPENROUTER_API_KEY.slice(0, 8) + "...)" : "MISSING",
    SMTP_HOST: process.env.SMTP_HOST || "(default: smtp.mail.me.com)",
    SMTP_USER: process.env.SMTP_USER || "MISSING",
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "SET (length: " + process.env.SMTP_PASSWORD.length + ")" : "MISSING",
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

  // Test SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mail.me.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.verify();
    results.smtp = { status: "OK - connection verified" };
  } catch (err) {
    results.smtp = { error: String(err) };
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
