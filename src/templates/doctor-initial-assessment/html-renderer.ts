import { TemplateProps } from "../registry";
import * as fs from "fs";
import * as path from "path";

/**
 * Intelligently wraps narrative clinical text onto individual dotted lines
 * respecting word boundaries and user-entered line breaks.
 */
function wrapTextIntoLines(text: string, maxCharsPerLine: number = 88): string[] {
  if (!text) return [];
  const result: string[] = [];
  const paragraphs = text.split("\n");

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
        currentLine += " " + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

/**
 * Render Doctor Initial Assessment as full HTML string for Playwright PDF generation.
 * (VSSH/DIAF/FORM/09)
 */
export function renderDoctorInitialAssessmentHtml(props: TemplateProps): string {
  const p = props.patientData;
  const c = props.generatedContent || {};

  const fontBase64 = loadFontAsBase64("public/fonts/Kalam-Regular.woff2");

  const val = (key: string, fallback: string = "") => c[key] || fallback;

  const isPallorYes = val("pallor", "No").toLowerCase().includes("yes");
  const isClubbingYes = val("clubbing", "No").toLowerCase().includes("yes");
  const isIcterusYes = val("icterus", "No").toLowerCase().includes("yes");
  const isEdemaYes = val("edema", "No").toLowerCase().includes("yes");
  const isEmaciatedYes = val("emaciated", "No").toLowerCase().includes("yes");

  const habitus = (val("bodyHabitus", "Average Built") || "Average Built").toLowerCase();
  const allergies = (val("allergies", "None") || "None").toLowerCase();

  const renderDottedSectionHtml = (title: string, content: string, lineCount: number) => {
    const wrapped = wrapTextIntoLines(content, 88);
    const totalLines = Math.max(lineCount, wrapped.length);

    let linesHtml = "";
    for (let i = 0; i < totalLines; i++) {
      const lineText = esc(wrapped[i] || "");
      linesHtml += `
        <div class="dotted-line-row">
          <span class="rough-narrative-handwriting">${lineText}</span>
        </div>`;
    }

    return `
      <div class="narrative-section">
        <div class="section-title">${esc(title)}</div>
        <div class="dotted-block">${linesHtml}</div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Doctor Initial Assessment - ${esc(p.name)}</title>
  <style>
    ${
      fontBase64
        ? `
    @font-face {
      font-family: 'Kalam';
      src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      font-weight: 400;
      font-style: normal;
    }`
        : ""
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 7mm 9mm 6mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .outer-border {
      border: 2px solid #000;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    /* Top Header Row */
    .header-row {
      display: flex;
      border-bottom: 1.5px solid #000;
    }

    .top-left-box {
      width: 44%;
      padding: 2.5mm 3mm;
      border-right: 1.5px solid #000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .hospital-brand {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      margin-bottom: 1mm;
    }

    .hospital-name {
      font-size: 11.5pt;
      font-weight: bold;
      font-family: Georgia, serif;
      color: #111;
      margin: 1mm 0 1.5mm;
    }

    .banner {
      background-color: #000;
      color: #fff;
      text-align: center;
      padding: 1.5mm 1mm;
      font-weight: bold;
      font-size: 10pt;
      letter-spacing: 0.06em;
    }

    .top-center-box {
      width: 16%;
      padding: 2mm;
      border-right: 1.5px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nabh-badge {
      width: 21mm;
      height: 21mm;
      border-radius: 50%;
      border: 2px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1mm;
      box-sizing: border-box;
      background: #fafafa;
    }

    .top-right-box {
      width: 40%;
      padding: 2mm 2.5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
    }

    .demographic-row {
      display: flex;
      align-items: flex-end;
      margin-bottom: 1.2mm;
      font-size: 8.5pt;
    }

    .demographic-label {
      font-weight: bold;
      white-space: nowrap;
      margin-right: 1.5mm;
      color: #111;
    }

    .demographic-fill {
      flex: 1;
      border-bottom: 1px dotted #444;
      padding-left: 1.5mm;
      min-height: 4.5mm;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    /* General Exam & Vitals */
    .vitals-row {
      padding: 1.5mm 2mm;
      font-size: 8.5pt;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      row-gap: 1.2mm;
      border-bottom: 1px solid #000;
    }

    .pain-row {
      padding: 1.2mm 2mm;
      font-size: 8.5pt;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #000;
    }

    .dotted-inline {
      display: inline-flex;
      border-bottom: 1px dotted #444;
      padding-left: 1mm;
      min-height: 4.2mm;
      align-items: flex-end;
      overflow: hidden;
    }

    .exam-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      text-align: left;
    }

    .exam-table td {
      padding: 1.5mm 2mm;
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      font-weight: 600;
    }

    .habitus-row {
      padding: 1.2mm 2mm;
      font-size: 8.5pt;
      display: flex;
      align-items: center;
      gap: 7mm;
      border-bottom: 1.5px solid #000;
    }

    /* Allergies */
    .allergies-box {
      border-bottom: 1.5px solid #000;
      padding: 1.5mm 2mm;
      font-size: 8.5pt;
    }

    .checkbox-square {
      display: inline-block;
      width: 3.2mm;
      height: 3.2mm;
      border: 1px solid #000;
      text-align: center;
      font-size: 7pt;
      line-height: 3.2mm;
      font-weight: bold;
      color: #083d8d;
    }

    /* Clinical Narrative Sections */
    .narrative-container {
      padding: 2mm 2.5mm;
    }

    .narrative-section {
      margin-bottom: 2.5mm;
    }

    .section-title {
      font-size: 8.5pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 0.2mm;
    }

    .dotted-line-row {
      min-height: 5.2mm;
      line-height: 5.2mm;
      border-bottom: 1px dotted #555;
      display: flex;
      align-items: flex-end;
      padding-left: 2mm;
      overflow: hidden;
    }

    /* Footer */
    .footer-row {
      margin-top: 2mm;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #111;
      padding: 0 1mm;
      font-weight: 600;
    }

    /* Rough real-handwriting typography for single values */
    .rough-handwriting {
      font-family: ${fontBase64 ? "'Kalam', " : ""}'Segoe UI', Arial, sans-serif;
      color: #083d8d;
      font-size: 9.5pt;
      font-weight: 500;
      letter-spacing: 0.015em;
      text-shadow: 0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25);
      filter: contrast(115%) brightness(97%);
      -webkit-font-smoothing: subpixel-antialiased;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Rough real-handwriting typography for multi-line narrative sections */
    .rough-narrative-handwriting {
      font-family: ${fontBase64 ? "'Kalam', " : ""}'Segoe UI', Arial, sans-serif;
      color: #083d8d;
      font-size: 9.5pt;
      font-weight: 500;
      letter-spacing: 0.015em;
      text-shadow: 0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25);
      filter: contrast(115%) brightness(97%);
      -webkit-font-smoothing: subpixel-antialiased;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: break-word;
      width: 100%;
      display: block;
    }

    .circled-choice {
      font-family: ${fontBase64 ? "'Kalam', " : ""}'Segoe UI', Arial, sans-serif;
      color: #083d8d;
      font-weight: bold;
      border: 1.2px solid #083d8d;
      border-radius: 50%;
      padding: 0.3mm 1.5mm;
      margin: 0 0.8mm;
      display: inline-block;
      text-shadow: 0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4);
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="outer-border">

      <!-- ========================================================================= -->
      <!-- TOP HEADER ROW                                                            -->
      <!-- ========================================================================= -->
      <div class="header-row">

        <!-- Top Left: Hospital Logo & Title -->
        <div class="top-left-box">
          <div class="hospital-brand">
            <!-- ========================================================================= -->
            <!-- HOSPITAL LOGO PLACEHOLDER                                                -->
            <!-- Replace SVG or insert <img src="/logo.png" /> below                      -->
            <!-- ========================================================================= -->
            <div style="width: 14mm; height: 14mm; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <path d="M 50 15 L 20 50 L 50 85 L 80 50 Z" fill="none" stroke="#111" stroke-width="7" />
                <line x1="50" y1="28" x2="50" y2="72" stroke="#cc0000" stroke-width="9" stroke-linecap="round" />
                <line x1="28" y1="50" x2="72" y2="50" stroke="#cc0000" stroke-width="9" stroke-linecap="round" />
              </svg>
            </div>
            <div>
              <div style="font-size: 11pt; font-weight: 900; letter-spacing: 0.04em; color: #000; line-height: 1.1;">
                VYAS MEDICITY
              </div>
              <div style="font-size: 6pt; color: #555; font-weight: 600; letter-spacing: 0.02em;">
                Super Speciality Care with Feelings
              </div>
            </div>
          </div>

          <div class="hospital-name">Vyas Super Speciality Hospital</div>
          <div class="banner">DOCTOR INITIAL ASSESSMENT</div>
        </div>

        <!-- Top Center: NABH Logo Placeholder -->
        <div class="top-center-box">
          <!-- ========================================================================= -->
          <!-- NABH LOGO PLACEHOLDER                                                    -->
          <!-- Replace SVG or insert <img src="/nabh.png" /> below                      -->
          <!-- ========================================================================= -->
          <div class="nabh-badge">
            <div style="font-size: 4.2pt; font-weight: bold; line-height: 1; color: #111;">
              PATIENT SAFETY &amp; QUALITY OF CARE
            </div>
            <div style="font-size: 8.5pt; font-weight: 900; letter-spacing: 0.05em; color: #000; margin: 0.5mm 0; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 0.2mm 1mm;">
              NABH
            </div>
            <div style="font-size: 4.5pt; font-weight: bold; letter-spacing: 0.03em; color: #111;">
              • ACCREDITED •
            </div>
          </div>
        </div>

        <!-- Top Right: Demographics -->
        <div class="top-right-box">
          <div class="demographic-row">
            <span class="demographic-label">Pt. Name:</span>
            <div class="demographic-fill"><span class="rough-handwriting">${esc(p.name)}</span></div>
          </div>
          <div class="demographic-row">
            <span class="demographic-label">Age:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(String(p.age))} yrs</span></div>
            <span class="demographic-label" style="margin-left: 3mm;">Gender:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(p.gender)}</span></div>
          </div>
          <div class="demographic-row">
            <span class="demographic-label">Reg. No.:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(p.patientNumber)}</span></div>
            <span class="demographic-label" style="margin-left: 3mm;">IPD No.:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(p.ipdNumber)}</span></div>
          </div>
          <div class="demographic-row">
            <span class="demographic-label">Ward:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(p.ward || "IPD-Gen")}</span></div>
            <span class="demographic-label" style="margin-left: 3mm;">Unit:</span>
            <div class="demographic-fill" style="flex: 1;"><span class="rough-handwriting">${esc(p.unit || "Unit-I")}</span></div>
          </div>
          <div class="demographic-row">
            <span class="demographic-label">Counsultant:</span>
            <div class="demographic-fill"><span class="rough-handwriting">${esc(p.consultant || "Dr. Medical Specialist")}</span></div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- GENERAL EXAMINATION & VITALS                                              -->
      <!-- ========================================================================= -->
      <div>
        <div class="vitals-row">
          <span style="font-weight: bold; margin-right: 3mm;">GENERAL EXAMINATION:</span>
          <span style="font-weight: bold; margin-right: 3mm;">Vital Signs:</span>

          <span style="font-weight: 600; margin-right: 1mm;">Temp:</span>
          <span class="dotted-inline" style="width: 16mm;"><span class="rough-handwriting">${esc(val("temp", "98.4 °F"))}</span></span>

          <span style="font-weight: 600; margin-left: 2mm; margin-right: 1mm;">Pulse:</span>
          <span class="dotted-inline" style="width: 18mm;"><span class="rough-handwriting">${esc(val("pulse", "78 /min"))}</span></span>

          <span style="font-weight: 600; margin-left: 2mm; margin-right: 1mm;">BP:</span>
          <span class="dotted-inline" style="width: 22mm;"><span class="rough-handwriting">${esc(val("bp", "120/80"))}</span></span>
          <span style="font-size: 8pt; margin-right: 2mm;">Mmhg</span>

          <span style="font-weight: 600; margin-left: 1mm; margin-right: 1mm;">RR:</span>
          <span class="dotted-inline" style="width: 16mm;"><span class="rough-handwriting">${esc(val("rr", "18 /min"))}</span></span>

          <span style="font-weight: 600; margin-left: 2mm; margin-right: 1mm;">Wt:</span>
          <span class="dotted-inline" style="width: 16mm;"><span class="rough-handwriting">${esc(val("wt", "65"))}</span></span>
          <span style="font-size: 8pt; margin-right: 2mm;">Kg.</span>

          <span style="font-weight: 600; margin-left: 1mm; margin-right: 1mm;">Height:</span>
          <span class="dotted-inline" style="width: 18mm;"><span class="rough-handwriting">${esc(val("height", "168"))}</span></span>
          <span style="font-size: 8pt;">cms/Inch</span>
        </div>

        <div class="pain-row">
          <span style="font-weight: 600; margin-right: 1.5mm;">Pain Score:</span>
          <span class="dotted-inline" style="width: 25mm;"><span class="rough-handwriting">${esc(val("painScore", "2/10"))}</span></span>

          <span style="font-weight: 600; margin-left: 6mm; margin-right: 1.5mm;">Location:</span>
          <span class="dotted-inline" style="flex: 1;"><span class="rough-handwriting">${esc(val("painLocation", "None"))}</span></span>
        </div>

        <table class="exam-table">
          <tr>
            <td style="width: 33.3%;">
              Pallor: 
              <span class="${isPallorYes ? "circled-choice" : ""}">${isPallorYes ? "Yes" : "Yes"}</span> / 
              <span class="${!isPallorYes ? "circled-choice" : ""}">${!isPallorYes ? "No" : "No"}</span>
            </td>
            <td style="width: 33.3%;">
              Clubbing: 
              <span class="${isClubbingYes ? "circled-choice" : ""}">${isClubbingYes ? "Yes" : "Yes"}</span> / 
              <span class="${!isClubbingYes ? "circled-choice" : ""}">${!isClubbingYes ? "No" : "No"}</span>
            </td>
            <td style="width: 33.4%; border-right: none;">
              Icterus: 
              <span class="${isIcterusYes ? "circled-choice" : ""}">${isIcterusYes ? "Yes" : "Yes"}</span> / 
              <span class="${!isIcterusYes ? "circled-choice" : ""}">${!isIcterusYes ? "No" : "No"}</span>
            </td>
          </tr>
          <tr>
            <td>
              Edema: 
              <span class="${isEdemaYes ? "circled-choice" : ""}">${isEdemaYes ? "Yes" : "Yes"}</span> / 
              <span class="${!isEdemaYes ? "circled-choice" : ""}">${!isEdemaYes ? "No" : "No"}</span>
            </td>
            <td>
              Emaciated: 
              <span class="${isEmaciatedYes ? "circled-choice" : ""}">${isEmaciatedYes ? "Yes" : "Yes"}</span> / 
              <span class="${!isEmaciatedYes ? "circled-choice" : ""}">${!isEmaciatedYes ? "No" : "No"}</span>
            </td>
            <td style="border-right: none;"></td>
          </tr>
        </table>

        <div class="habitus-row">
          <span style="font-weight: bold;">Body Habitus:</span>
          <span class="${habitus.includes("obese") ? "circled-choice" : ""}">Obese</span>
          <span class="${habitus.includes("average") || habitus.includes("normal") ? "circled-choice" : ""}">Average Built</span>
          <span class="${habitus.includes("thin") ? "circled-choice" : ""}">Thin</span>
          <span class="${habitus.includes("cachectic") ? "circled-choice" : ""}">Cachectic</span>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ALLERGIES SECTION                                                         -->
      <!-- ========================================================================= -->
      <div class="allergies-box">
        <div style="font-weight: bold; margin-bottom: 1mm;">ALLERGIES:</div>
        <div style="display: flex; align-items: center; gap: 8mm; margin-bottom: 1mm;">
          <div style="display: flex; align-items: center; gap: 1.5mm;">
            <span class="checkbox-square">${allergies.includes("blood") ? "✓" : ""}</span>
            <span>Blood Transfusion</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1.5mm;">
            <span class="checkbox-square">${allergies.includes("drug") ? "✓" : ""}</span>
            <span>Drug</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1.5mm;">
            <span class="checkbox-square">${allergies.includes("food") ? "✓" : ""}</span>
            <span>Food &amp; Beverages</span>
          </div>
          <div style="display: flex; align-items: center; gap: 1.5mm;">
            <span class="checkbox-square">${!allergies.includes("blood") && !allergies.includes("drug") && !allergies.includes("food") ? "✓" : ""}</span>
            <span>None</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; margin-top: 1mm;">
          <span class="checkbox-square">${allergies.includes("other") || (!allergies.includes("none") && allergies.length > 5) ? "✓" : ""}</span>
          <span style="margin-left: 1.5mm; margin-right: 1.5mm;">Other(Please Specify):</span>
          <div class="demographic-fill" style="flex: 1;">
            <span class="rough-handwriting">${allergies.includes("none") ? "—" : esc(val("allergies"))}</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- CLINICAL NARRATIVE DOTTED SECTIONS                                        -->
      <!-- ========================================================================= -->
      <div class="narrative-container">
        ${renderDottedSectionHtml(
          "Chief Complaints:",
          val("chiefComplaints", `1. Acute symptoms consistent with ${p.primaryDiagnosis}`),
          4
        )}
        ${renderDottedSectionHtml(
          "History of Presenting Illness (HOPI):",
          val(
            "hopi",
            `Patient presented with acute complaints related to ${p.primaryDiagnosis}. Symptom onset was gradual with progressive discomfort. Admitted for active clinical assessment and medical management.`
          ),
          7
        )}
        ${renderDottedSectionHtml(
          "Birth History:",
          val(
            "birthHistory",
            p.age < 18
              ? "Full-term normal vaginal delivery at hospital, birth weight normal, uneventful neonatal period."
              : "Full-term normal delivery, uneventful perinatal period, no known childhood or birth complications."
          ),
          3
        )}
        ${renderDottedSectionHtml(
          "Growth & Developmental History:",
          val("growthDevelopment", "Normal developmental milestones attained for age. Physical and cognitive growth normal."),
          3
        )}
        ${renderDottedSectionHtml(
          "Immunization History:",
          val("immunizationHistory", "Immunized for age as per National Immunization Schedule (NIS)."),
          3
        )}
        ${renderDottedSectionHtml(
          "Nutritional Growth & Development History:",
          val("nutritionalHistory", "Consumes regular balanced vegetarian/mixed diet. Appetite normal. No significant recent weight changes."),
          3
        )}
      </div>

    </div>

    <!-- Page Footer -->
    <div class="footer-row">
      <div>VSSH/DIAF/FORM/09</div>
      <div>Page 1 of 4</div>
      <div>Rev. 01/ June 2026</div>
    </div>
  </div>
</body>
</html>`;
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
      relativePath.replace(/^public[\\/]/, "")
    );
    const buffer = fs.readFileSync(absolutePath);
    return buffer.toString("base64");
  } catch {
    return null;
  }
}
