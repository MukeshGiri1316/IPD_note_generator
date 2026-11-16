import { TemplateProps } from "../registry";
import * as fs from "fs";
import * as path from "path";

/**
 * Render the discharge summary as a full HTML string — used by Playwright PDF.
 *
 * Fixed layout: clean formal hospital borders and headers in black.
 * Dynamic entries (patient details & clinical sections): rendered in blue pen ink (#084298) with Kalam handwriting font.
 */
export function renderDischargeSummaryHtml(props: TemplateProps): string {
  const p = props.patientData;
  const c = props.generatedContent;

  // Load handwriting font as base64 for PDF embedding
  const fontBase64 = loadFontAsBase64("public/fonts/Kalam-Regular.woff2");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discharge Summary - ${esc(p.name)}</title>
  <style>
    ${fontBase64 ? `
    @font-face {
      font-family: 'Kalam';
      src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      font-weight: 400;
      font-style: normal;
    }` : ""}

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 14mm;
      background: #fff;
      display: flex;
      flex-direction: column;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 3mm;
      margin-bottom: 3mm;
    }
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
    }
    .header p {
      font-size: 9pt;
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      color: #333;
    }

    .title-bar {
      text-align: center;
      margin: 2mm 0 3mm;
    }
    .title-bar h2 {
      font-size: 13pt;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif;
      text-decoration: underline;
      margin: 0;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4mm;
      border: 1px solid #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
    }
    .info-table td {
      padding: 1.5mm 2mm;
      border-bottom: 1px solid #ccc;
    }
    .info-table .label { font-weight: bold; white-space: nowrap; color: #000; }
    .info-table .colon { text-align: center; padding: 1.5mm 1mm; color: #000; }

    /* Blue pen handwriting typography for patient placeholders with rough pen texture */
    .info-table .value {
      font-family: ${fontBase64 ? "'Kalam', " : ""}'Segoe UI', Arial, sans-serif;
      color: #083d8d;
      font-size: 10pt;
      font-weight: 500;
      letter-spacing: 0.015em;
      text-shadow: 0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25);
      filter: contrast(115%) brightness(97%);
      -webkit-font-smoothing: subpixel-antialiased;
    }

    .section { margin-bottom: 3mm; }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      font-family: Arial, Helvetica, sans-serif;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
      margin-bottom: 1.5mm;
      color: #000;
    }

    /* Blue pen handwriting typography for generated clinical content with rough pen texture */
    .section-content {
      margin: 1mm 0 0 0;
      white-space: pre-wrap;
      font-family: ${fontBase64 ? "'Kalam', " : ""}'Segoe UI', Arial, sans-serif;
      color: #083d8d;
      font-size: 10.5pt;
      line-height: 1.45;
      letter-spacing: 0.015em;
      text-shadow: 0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25);
      filter: contrast(115%) brightness(97%);
      -webkit-font-smoothing: subpixel-antialiased;
    }

    .footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      padding-top: 8mm;
      font-family: Arial, Helvetica, sans-serif;
    }
    .sig-block { width: 35%; text-align: center; }
    .sig-line { border-bottom: 1px solid #000; margin-bottom: 2mm; height: 8mm; }
    .sig-label { font-size: 9pt; margin: 0; }

    .ai-disclaimer {
      font-size: 7pt;
      color: #666;
      text-align: center;
      margin-top: 3mm;
      font-family: Arial, Helvetica, sans-serif;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Hospital Header -->
    <div class="header">
      <h1>VYAS SUPERSPECIALITY HOSPITAL</h1>
      <p>123 Medical Road, City — Phone: 0123-456789</p>
    </div>

    <!-- Document Title -->
    <div class="title-bar">
      <h2>DISCHARGE SUMMARY</h2>
    </div>

    <!-- Patient Information -->
    <table class="info-table">
      <tr>
        <td class="label">Patient Name</td>
        <td class="colon">:</td>
        <td class="value">${esc(p.name)}</td>
        <td class="label">IPD No.</td>
        <td class="colon">:</td>
        <td class="value">${esc(p.ipdNumber)}</td>
      </tr>
      <tr>
        <td class="label">Age / Gender</td>
        <td class="colon">:</td>
        <td class="value">${esc(String(p.age))} yrs / ${esc(p.gender)}</td>
        <td class="label">Reg. No.</td>
        <td class="colon">:</td>
        <td class="value">${esc(p.patientNumber)}</td>
      </tr>
      <tr>
        <td class="label">Date of Admission</td>
        <td class="colon">:</td>
        <td class="value">${esc(p.admissionDate)}</td>
        <td class="label">Date of Discharge</td>
        <td class="colon">:</td>
        <td class="value">${esc(p.dischargeDate || "—")}</td>
      </tr>
      <tr>
        <td class="label">Diagnosis</td>
        <td class="colon">:</td>
        <td colspan="4" class="value">${esc(p.primaryDiagnosis)}${p.secondaryDiagnosis ? " / " + esc(p.secondaryDiagnosis) : ""}</td>
      </tr>
    </table>

    <!-- Clinical Sections -->
    ${section("Clinical History", c.clinicalHistory)}
    ${section("Examination", c.examination)}
    ${section("Investigation Summary", c.investigationSummary)}
    ${section("Hospital Course", c.hospitalCourse)}
    ${section("Condition at Discharge", c.conditionAtDischarge)}
    ${section("Discharge Advice", c.dischargeAdvice)}

    <!-- Footer -->
    <div class="footer">
      <div class="sig-block">
        <div class="sig-line"></div>
        <p class="sig-label">Treating Doctor</p>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <p class="sig-label">Consultant</p>
      </div>
    </div>

    <p class="ai-disclaimer">
      ⚕ AI-assisted draft — must be reviewed and approved by an authorized clinician before finalization.
    </p>

  </div>
</body>
</html>`;
}

function section(title: string, content?: string): string {
  return `
    <div class="section">
      <div class="section-title">${esc(title)}</div>
      <p class="section-content">${esc(content || "—")}</p>
    </div>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadFontAsBase64(relativePath: string): string | null {
  try {
    const absolutePath = path.join(
      process.cwd(),
      "public",
      relativePath.replace(/^public[\\/]/, ""),
    );
    const buffer = fs.readFileSync(absolutePath);
    return buffer.toString("base64");
  } catch {
    return null;
  }
}
