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

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(score: number): string {
  if (score >= 7) return "#059669";
  if (score >= 4) return "#d97706";
  return "#dc2626";
}

function buildSwotHtml(swot: AnalysisReport["analysis"]["swot"]): string {
  const quadrant = (title: string, items: string[], bg: string, color: string, icon: string) => `
    <td style="width:50%;padding:8px;vertical-align:top">
      <div style="background:${bg};border-radius:10px;padding:14px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:${color}">${icon} ${title}</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#374151">
          ${items.map(i => `<li>${esc(i)}</li>`).join("")}
        </ul>
      </div>
    </td>`;

  return `
    <table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:24px">
      <tr>
        ${quadrant("Mocne strony", swot.strengths, "#ecfdf5", "#065f46", "S")}
        ${quadrant("Slabe strony", swot.weaknesses, "#fef2f2", "#991b1b", "W")}
      </tr>
      <tr>
        ${quadrant("Szanse", swot.opportunities, "#eff6ff", "#1e40af", "O")}
        ${quadrant("Zagrozenia", swot.threats, "#fffbeb", "#92400e", "T")}
      </tr>
    </table>`;
}

function buildCategoriesHtml(categories: AnalysisReport["analysis"]["categories"]): string {
  return categories.map(cat => {
    const color = scoreColor(cat.score);
    return `
      <div style="margin-bottom:24px;padding:18px;background:#f9fafb;border-radius:12px;border-left:4px solid ${color}">
        <div style="margin-bottom:12px">
          <span style="font-size:16px;font-weight:bold;color:#111827">${esc(cat.name)}</span>
          <span style="float:right;font-size:20px;font-weight:bold;color:${color}">${cat.score}/10</span>
        </div>
        <div style="background:#fff7ed;border-radius:8px;padding:10px 14px;margin-bottom:12px">
          <p style="margin:0;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Hipoteza</p>
          <p style="margin:4px 0 0;font-size:14px;color:#78350f;font-style:italic">${esc(cat.hypothesis)}</p>
        </div>
        <div style="margin-bottom:12px">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Dowody</p>
          <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6;color:#6b7280">
            ${cat.evidence.map(e => `<li>${esc(e)}</li>`).join("")}
          </ul>
        </div>
        <div style="margin-bottom:12px">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Obserwacje</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#374151">
            ${cat.findings.map(f => `<li style="margin-bottom:4px">${esc(f)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Rekomendacje</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#374151">
            ${cat.recommendations.map(r => `<li style="margin-bottom:4px">${esc(r)}</li>`).join("")}
          </ul>
        </div>
      </div>`;
  }).join("");
}

function buildActionPlanHtml(actionPlan: AnalysisReport["analysis"]["actionPlan"]): string {
  const section = (title: string, subtitle: string, items: typeof actionPlan.quickWins, color: string, bg: string) => {
    if (items.length === 0) return "";
    return `
      <div style="margin-bottom:20px">
        <div style="margin-bottom:10px">
          <span style="display:inline-block;background:${color};color:white;padding:3px 12px;border-radius:8px;font-size:12px;font-weight:bold">${title}</span>
          <span style="font-size:12px;color:#9ca3af;margin-left:8px">${subtitle}</span>
        </div>
        ${items.map(item => `
          <div style="background:${bg};border-radius:8px;padding:12px 14px;margin-bottom:8px">
            <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#111827">${esc(item.area)}</p>
            <p style="margin:0 0 4px;font-size:14px;color:#374151">${esc(item.action)}</p>
            <p style="margin:0;font-size:13px;color:#6b7280">Efekt: ${esc(item.expectedImpact)}${item.kpiMetric ? ` | KPI: ${esc(item.kpiMetric)}` : ""}</p>
          </div>
        `).join("")}
      </div>`;
  };

  return section("QUICK WINS", "0-30 dni", actionPlan.quickWins, "#059669", "#ecfdf5")
    + section("CORE CHANGES", "1-3 miesiace", actionPlan.coreChanges, "#d97706", "#fffbeb")
    + section("TRANSFORMATION", "3-6 miesiecy", actionPlan.transformation, "#7c3aed", "#f5f3ff");
}

function buildMetricsHtml(metrics: AnalysisReport["analysis"]["keyMetrics"]): string {
  if (metrics.length === 0) return "";
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr style="background:#f9fafb">
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Metryka</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Stan obecny</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Cel</th>
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Timeline</th>
      </tr>
      ${metrics.map(m => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:bold;color:#111827">${esc(m.metric)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#dc2626">${esc(m.current)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#059669;font-weight:bold">${esc(m.target)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">${esc(m.timeline)}</td>
        </tr>`).join("")}
    </table>`;
}

export async function sendFullReportEmail(report: AnalysisReport, researchNotes: string) {
  const { analysis } = report;
  const es = analysis.executiveSummary;

  const clientCategoriesHtml = report.problemCategories.length > 0
    ? report.problemCategories.map(cat => `<span style="display:inline-block;background:#fff7ed;color:#ea580c;padding:2px 10px;border-radius:12px;font-size:13px;margin:2px">${esc(cat)}</span>`).join(" ")
    : "<em>Nie wybrano</em>";

  const researchHtml = researchNotes
    ? esc(researchNotes).replace(/\n/g, "<br/>")
    : "<em>Brak danych z researchu</em>";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;color:#1f2937">
      <div style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:24px 32px;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">Raport Consultingowy</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">BeautyRise Deep Analysis | Metodologia McKinsey + BCG</p>
      </div>
      <div style="background:#ffffff;padding:24px 32px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px">

        <!-- Dane klienta -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Dane klienta</p>
          <h2 style="font-size:18px;margin:0 0 8px;color:#111827">${esc(report.salonName)}</h2>
          <table style="border-collapse:collapse">
            <tr>
              <td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Instagram:</td>
              <td style="padding:2px 0;font-size:14px">@${esc(report.instagramHandle)}</td>
            </tr>
            ${report.contactName ? `<tr><td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Imie:</td><td style="padding:2px 0;font-size:14px">${esc(report.contactName)}</td></tr>` : ""}
            ${report.email ? `<tr><td style="padding:2px 12px 2px 0;color:#92400e;font-size:14px">Email:</td><td style="padding:2px 0;font-size:14px"><a href="mailto:${esc(report.email)}">${esc(report.email)}</a></td></tr>` : ""}
          </table>
          <div style="margin-top:8px">${clientCategoriesHtml}</div>
        </div>

        <!-- Executive Summary (SCR + Score) -->
        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="text-align:center;margin-bottom:16px">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Ocena ogolna</p>
            <p style="margin:0;font-size:44px;font-weight:bold;color:${scoreColor(es.overallScore)}">${es.overallScore}/10</p>
          </div>
          <div style="margin-bottom:12px">
            <p style="margin:0 0 4px;font-size:12px;color:#059669;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Sytuacja</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${esc(es.situation)}</p>
          </div>
          <div style="margin-bottom:12px">
            <p style="margin:0 0 4px;font-size:12px;color:#dc2626;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Problem</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${esc(es.complication)}</p>
          </div>
          <div>
            <p style="margin:0 0 4px;font-size:12px;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold">Rekomendacja strategiczna</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-weight:500">${esc(es.resolution)}</p>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- SWOT -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Analiza SWOT</h2>
        ${buildSwotHtml(analysis.swot)}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- Szczegolowa analiza kategorii -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Szczegolowa analiza (MECE)</h2>
        ${buildCategoriesHtml(analysis.categories)}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- Plan dzialania -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Plan dzialania (Results Delivery)</h2>
        ${buildActionPlanHtml(analysis.actionPlan)}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

        <!-- KPIs -->
        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">Kluczowe metryki (KPIs)</h2>
        ${buildMetricsHtml(analysis.keyMetrics)}

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
    from: `"BeautyRise" <${process.env.SMTP_USER}>`,
    to: "wojtek@beautyrise.pl",
    subject: `Raport: ${report.salonName} (@${report.instagramHandle})`,
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
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Salon:</td><td style="font-size:14px">${esc(request.salonName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Instagram:</td><td style="font-size:14px">@${esc(request.instagramHandle)}</td></tr>
          ${request.contactName ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Imie:</td><td style="font-size:14px">${esc(request.contactName)}</td></tr>` : ""}
          ${request.email ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Email:</td><td style="font-size:14px"><a href="mailto:${esc(request.email)}">${esc(request.email)}</a></td></tr>` : ""}
        </table>
        <p style="font-size:14px;color:#4b5563;margin-bottom:16px">${esc(request.problemDescription)}</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:13px;color:#991b1b;font-family:monospace;word-break:break-all">
          ${esc(errorMessage)}
        </div>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"BeautyRise" <${process.env.SMTP_USER}>`,
    to: "wojtek@beautyrise.pl",
    subject: `BLAD analizy: ${request.salonName}`,
    html,
  });
}
