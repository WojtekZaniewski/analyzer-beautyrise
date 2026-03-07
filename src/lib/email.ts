import { Resend } from "resend";
import { AnalysisReport } from "./types";

function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendReportEmail(report: AnalysisReport) {
  const { analysis } = report;

  const categoriesHtml = report.problemCategories.length > 0
    ? report.problemCategories.map((cat) => `<span style="display:inline-block;background:#fff7ed;color:#ea580c;padding:2px 10px;border-radius:12px;font-size:13px;margin:2px">${cat}</span>`).join(" ")
    : "<em>Nie wybrano</em>";

  const scoresHtml = analysis.categories
    .map((cat) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${cat.name}</td><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:bold">${cat.score}/10</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <div style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:24px 32px;border-radius:16px 16px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">Nowa analiza salonu</h1>
      </div>
      <div style="background:#ffffff;padding:24px 32px;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 16px 16px">

        <h2 style="font-size:18px;margin:0 0 16px;color:#111827">${report.salonName}</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="padding:4px 0;color:#6b7280;font-size:14px">Instagram:</td>
            <td style="padding:4px 0;font-size:14px">@${report.instagramHandle}</td>
          </tr>
          ${report.contactName ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:14px">Imie:</td><td style="padding:4px 0;font-size:14px">${report.contactName}</td></tr>` : ""}
          ${report.email ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:14px">Email:</td><td style="padding:4px 0;font-size:14px"><a href="mailto:${report.email}">${report.email}</a></td></tr>` : ""}
        </table>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Ocena ogolna</p>
          <p style="margin:0;font-size:32px;font-weight:bold;color:${analysis.overallScore >= 7 ? '#059669' : analysis.overallScore >= 4 ? '#d97706' : '#dc2626'}">${analysis.overallScore}/10</p>
        </div>

        <p style="font-size:14px;color:#4b5563;line-height:1.6;margin-bottom:20px">${analysis.summary}</p>

        <div style="margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Wyzwania klienta</p>
          <p style="font-size:14px;color:#4b5563;margin:0 0 8px">${report.problemDescription}</p>
          <div>${categoriesHtml}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Kategoria</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Ocena</th>
          </tr>
          ${scoresHtml}
        </table>

        <p style="font-size:12px;color:#9ca3af;margin-top:24px">ID raportu: ${report.id}</p>
      </div>
    </div>
  `;

  await getClient().emails.send({
    from: "BeautyRise Analyzer <onboarding@resend.dev>",
    to: "wojtek@beautyrise.pl",
    subject: `Nowa analiza: ${report.salonName}`,
    html,
  });
}
