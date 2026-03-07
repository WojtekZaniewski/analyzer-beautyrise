import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

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
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: "Odpowiedz jednym slowem: OK" }],
        max_tokens: 10,
      }),
    });
    const data = await res.json();
    results.openrouter = { status: res.ok ? "OK" : "ERROR", response: data.choices?.[0]?.message?.content || data };
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

  return NextResponse.json(results, { status: 200 });
}
