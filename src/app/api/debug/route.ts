import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.envVars = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.slice(0, 10) + "...)" : "MISSING",
    SMTP_HOST: process.env.SMTP_HOST || "(default: smtp.mail.me.com)",
    SMTP_USER: process.env.SMTP_USER || "MISSING",
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "SET (length: " + process.env.SMTP_PASSWORD.length + ")" : "MISSING",
  };

  // Test Gemini with fallback models
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Odpowiedz jednym slowem: OK" }] }],
            generationConfig: {
              maxOutputTokens: 10,
              ...(model.includes("2.5") && { thinkingConfig: { thinkingBudget: 0 } }),
            },
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        results.gemini = { status: "OK", model, response: text };
        break;
      }
      results.gemini = { status: "ERROR", model, error: data.error?.message?.slice(0, 200) };
    } catch (err) {
      results.gemini = { error: String(err), model };
    }
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
