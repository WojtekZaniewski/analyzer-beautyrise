import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from "nodemailer";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.envVars = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.slice(0, 8) + "...)" : "MISSING",
    SMTP_HOST: process.env.SMTP_HOST || "(default: smtp.mail.me.com)",
    SMTP_USER: process.env.SMTP_USER || "MISSING",
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "SET (length: " + process.env.SMTP_PASSWORD.length + ")" : "MISSING",
  };

  // Test Gemini
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Odpowiedz jednym slowem: OK");
    results.gemini = { status: "OK", response: result.response.text() };
  } catch (err) {
    results.gemini = { error: String(err) };
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
