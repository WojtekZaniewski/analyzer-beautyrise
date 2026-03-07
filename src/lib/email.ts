import nodemailer from "nodemailer";
import { AnalysisReport } from "./types";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mail.me.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendFullReportEmail(report: AnalysisReport, researchNotes: string) {
  const { analysis } = report;

  const categoriesHtml = report.problemCategories.length > 0
    ? report.problemCategories.map((cat) => `<span style="display:inline-block;background:#fff7ed;color:#ea580c;padding:2px 10px;border-radius:12px;font-size:13px;margin:2px">${escapeHtml(cat)}</span>`).join(" ")
    : "<em>Nie wybrano</em>";

  const categoryDetailsHtml = analysis.categories
    .map((cat) => {
      const findingsHtml = cat.findings
        .map((f) => `<li style="margin-bottom:6px;color:#374151">${escapeHtml(f)}</li>`)
        .join("");
      const recsHtml = cat.recommendations
        .map((r) => `<li style="margin-bottom:6px;color:#374151">${escapeHtml(r)}</li>`)
        .join("");

      const scoreColor = cat.score >= 7 ? '#059669' : cat.score >= 4 ? '#d97706' : '#dc2626';

      return `
        <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h3 style="margin:0;font-size:16px;color:#111827">${escapeHtml(cat.name)}</h3>
            <span style="font-size:20px;font-weight:bold;color:${scoreColor}">${cat.score}/10</span>
          </div>
          <div style="margin-bottom:12px">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Obserwacje</p>
            <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6">${findingsHtml}</ul>
          </div>
          <div>
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Rekomendacje</p>
            <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6">${recsHtml}</ul>
          </div>
        </div>`;
    })
    .join("");

  const priorityColors: Record<string, string> = {
    high: "#dc2626",
    medium: "#d97706",
    low: "#059669",
  };
  const priorityLabels: Record<string, string> = {
    high: "WYSOKI",
    medium: "SREDNI",
    low: "NISKI",
  };

  const actionPlanHtml = analysis.actionPlan
    .map((item) => {
      const color = priorityColors[item.priority] || "#6b7280";
      const label = priorityLabels[item.priority] || item.priority;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top">
            <span style="display:inline-block;background:${color};color:white;padding:1px 8px;border-radius:8px;font-size:11px;font-weight:bold">${label}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;vertical-align:top">
            <strong>${escapeHtml(item.area)}</strong><br/>
            ${escapeHtml(item.action)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;vertical-align:top">
            ${escapeHtml(item.expectedImpact)}
          </td>
        </tr>`;
    })
    .join("");

  const researchHtml = researchNotes
    ? escapeHtml(researchNotes).replace(/\n/g, "<br/>")
    : "<em>Brak danych z researchu</em>";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;color:#1f2937">
      <div style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:24px 32px;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">Pelna analiza salonu</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Deep Research Report</p>
      </div>
      <div style="background:#ffffff;padding:24px 32px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px">

        <!-- Dane kontaktowe klienta -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Dane klienta</p>
          <h2 style="font-size:18px;margin:0 0 8px;color:#111827">${escapeHtml(report.salonName)}</h2>
          <table style="border-collapse:collapse">
            <tr>
              <td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Instagram:</td>
              <td style="padding:2px 0;font-size:14px">@${escapeHtml(report.instagramHandle)}</td>
            </tr>
            ${report.contactName ? `<tr><td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Imie:</td><td style="padding:2px 0;font-size:14px">${escapeHtml(report.contactName)}</td></tr>` : ""}
            ${report.email ? `<tr><td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Email:</td><td style="padding:2px 0;font-size:14px"><a href="mailto:${escapeHtml(report.email)}">${escapeHtml(report.email)}</a></td></tr>` : ""}
          </table>
        </div>

        <!-- Ocena ogolna -->
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Ocena ogolna</p>
          <p style="margin:0;font-size:40px;font-weight:bold;color:${analysis.overallScore >= 7 ? '#059669' : analysis.overallScore >= 4 ? '#d97706' : '#dc2626'}">${analysis.overallScore}/10</p>
        </div>

        <p style="font-size:15px;color:#4b5563;line-height:1.6;margin-bottom:24px">${escapeHtml(analysis.summary)}</p>

        <!-- Wyzwania klienta -->
        <div style="margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Wyzwania klienta</p>
          <p style="font-size:14px;color:#4b5563;margin:0 0 8px">${escapeHtml(report.problemDescription)}</p>
          <div>${categoriesHtml}</div>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- Szczegolowa analiza kategorii -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Szczegolowa analiza</h2>
        ${categoryDetailsHtml}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- Plan dzialania -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Plan dzialania</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;width:80px">Priorytet</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Dzialanie</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;width:180px">Oczekiwany efekt</th>
          </tr>
          ${actionPlanHtml}
        </table>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- Wyniki researchu -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Wyniki badania internetowego</h2>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;font-size:13px;color:#4b5563;line-height:1.7">
          ${researchHtml}
        </div>

        <p style="font-size:11px;color:#9ca3af;margin-top:24px">ID raportu: ${report.id} | ${report.createdAt}</p>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: "wojtek@beautyrise.pl",
    subject: `Analiza: ${report.salonName} (@${report.instagramHandle})`,
    html,
  });
}

export async function sendErrorNotificationEmail(
  request: { salonName: string; instagramHandle: string; contactName?: string; email?: string; problemDescription: string },
  error: unknown
) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <div style="background:#dc2626;padding:24px 32px;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">Blad analizy</h1>
      </div>
      <div style="background:#ffffff;padding:24px 32px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px">
        <p style="color:#dc2626;font-weight:bold">Analiza nie powiodla sie dla:</p>
        <table style="border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Salon:</td><td style="font-size:14px">${escapeHtml(request.salonName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Instagram:</td><td style="font-size:14px">@${escapeHtml(request.instagramHandle)}</td></tr>
          ${request.contactName ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Imie:</td><td style="font-size:14px">${escapeHtml(request.contactName)}</td></tr>` : ""}
          ${request.email ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Email:</td><td style="font-size:14px"><a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email)}</a></td></tr>` : ""}
        </table>
        <p style="font-size:14px;color:#4b5563;margin-bottom:16px">${escapeHtml(request.problemDescription)}</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:13px;color:#991b1b;font-family:monospace;word-break:break-all">
          ${escapeHtml(errorMessage)}
        </div>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: "wojtek@beautyrise.pl",
    subject: `BLAD analizy: ${request.salonName}`,
    html,
  });
}
