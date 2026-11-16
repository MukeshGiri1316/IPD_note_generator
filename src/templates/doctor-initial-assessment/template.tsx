import React from "react";
import { TemplateProps } from "../registry";

/**
 * Doctor Initial Assessment React Template (VSSH/DIAF/FORM/09).
 * Page 1 of 4.
 *
 * Includes:
 * - Hospital Logo Placeholder
 * - NABH Logo Placeholder
 * - Exact layout of the official pre-printed assessment form
 * - Rough real-handwriting styling for clinical entries
 * - Multi-line word-wrapped narrative rendering on pre-printed dotted lines
 */

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

export default function DoctorInitialAssessmentTemplate({
  patientData,
  generatedContent,
}: TemplateProps) {
  const p = patientData;
  const c = generatedContent || {};

  // Helper to format values or return fallback
  const val = (key: string, fallback: string = "") => c[key] || fallback;

  // Render narrative content onto pre-printed dotted lines with proper wrapping
  const renderDottedSection = (
    title: string,
    content: string,
    lineCount: number
  ) => {
    const wrapped = wrapTextIntoLines(content, 120);
    const totalLines = Math.max(lineCount, wrapped.length);

    const lines: string[] = [];
    for (let i = 0; i < totalLines; i++) {
      lines.push(wrapped[i] || "");
    }

    return (
      <div style={{ marginBottom: "2.5mm" }}>
        <div style={sectionHeaderTitleStyle}>{title}</div>
        <div style={{ marginTop: "0.5mm" }}>
          {lines.map((line, idx) => (
            <div
              key={idx}
              style={{
                minHeight: "5.2mm",
                lineHeight: "5.2mm",
                borderBottom: "1px dotted #555",
                display: "flex",
                alignItems: "flex-end",
                paddingLeft: "2mm",
                paddingRight: "2mm",
                boxSizing: "border-box",
              }}
            >
              <span style={roughNarrativeHandwritingStyle}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isPallorYes = val("pallor", "No").toLowerCase().includes("yes");
  const isClubbingYes = val("clubbing", "No").toLowerCase().includes("yes");
  const isIcterusYes = val("icterus", "No").toLowerCase().includes("yes");
  const isEdemaYes = val("edema", "No").toLowerCase().includes("yes");
  const isEmaciatedYes = val("emaciated", "No").toLowerCase().includes("yes");

  const habitus = (val("bodyHabitus", "Average Built") || "Average Built").toLowerCase();
  const allergies = (val("allergies", "None") || "None").toLowerCase();

  return (
    <div style={outerContainerStyle}>
      {/* Outer Border Box */}
      <div style={innerBorderStyle}>
        {/* ========================================================================= */}
        {/* TOP HEADER SECTION (Hospital Logo, NABH Accreditation, Patient Demographics) */}
        {/* ========================================================================= */}
        <div style={headerRowStyle}>
          {/* Top-Left: Hospital Logo & Title Banner */}
          <div style={topLeftBoxStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm", marginBottom: "1mm" }}>
              {/* ========================================================================= */}
              {/* HOSPITAL LOGO PLACEHOLDER                                                */}
              {/* Replace SVG or add <img src="/path/to/logo.png" /> below                 */}
              {/* ========================================================================= */}
              <div
                style={{
                  width: "14mm",
                  height: "14mm",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {/* Clean SVG Placeholder for Vyas Medicity Logo */}
                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                  <path
                    d="M 50 15 L 20 50 L 50 85 L 80 50 Z"
                    fill="none"
                    stroke="#111"
                    strokeWidth="7"
                  />
                  <line x1="50" y1="28" x2="50" y2="72" stroke="#cc0000" strokeWidth="9" strokeLinecap="round" />
                  <line x1="28" y1="50" x2="72" y2="50" stroke="#cc0000" strokeWidth="9" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: "11pt", fontWeight: "900", letterSpacing: "0.04em", color: "#000", lineHeight: "1.1" }}>
                  VYAS MEDICITY
                </div>
                <div style={{ fontSize: "6pt", color: "#555", fontWeight: "600", letterSpacing: "0.02em" }}>
                  Super Speciality Care with Feelings
                </div>
              </div>
            </div>

            <div style={{ fontSize: "11.5pt", fontWeight: "bold", fontFamily: "Georgia, serif", color: "#111", margin: "1mm 0 1.5mm" }}>
              Vyas Super Speciality Hospital
            </div>

            {/* Black Banner */}
            <div
              style={{
                backgroundColor: "#000",
                color: "#fff",
                textAlign: "center",
                padding: "1.5mm 1mm",
                fontWeight: "bold",
                fontSize: "10pt",
                letterSpacing: "0.06em",
                borderRadius: "1px",
              }}
            >
              DOCTOR INITIAL ASSESSMENT
            </div>
          </div>

          {/* Top-Center: NABH Accredited Logo Placeholder */}
          <div style={topCenterBoxStyle}>
            {/* ========================================================================= */}
            {/* NABH LOGO PLACEHOLDER                                                    */}
            {/* Replace SVG or add <img src="/path/to/nabh-logo.png" /> below            */}
            {/* ========================================================================= */}
            <div
              style={{
                width: "21mm",
                height: "21mm",
                borderRadius: "50%",
                border: "2px solid #000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "1mm",
                boxSizing: "border-box",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: "4.2pt", fontWeight: "bold", lineHeight: "1", color: "#111" }}>
                PATIENT SAFETY &amp; QUALITY OF CARE
              </div>
              <div
                style={{
                  fontSize: "8.5pt",
                  fontWeight: "900",
                  letterSpacing: "0.05em",
                  color: "#000",
                  margin: "0.5mm 0",
                  borderTop: "1px solid #111",
                  borderBottom: "1px solid #111",
                  padding: "0.2mm 1mm",
                }}
              >
                NABH
              </div>
              <div style={{ fontSize: "4.5pt", fontWeight: "bold", letterSpacing: "0.03em", color: "#111" }}>
                • ACCREDITED •
              </div>
            </div>
          </div>

          {/* Top-Right: Patient Demographics Form */}
          <div style={topRightBoxStyle}>
            {/* Row 1: Pt. Name */}
            <div style={dottedInputRowStyle}>
              <span style={inputLabelStyle}>Pt. Name:</span>
              <div style={dottedLineFillStyle}>
                <span style={roughHandwritingStyle}>{p.name}</span>
              </div>
            </div>

            {/* Row 2: Age & Gender */}
            <div style={dottedInputRowStyle}>
              <span style={inputLabelStyle}>Age:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.age} yrs</span>
              </div>
              <span style={{ ...inputLabelStyle, marginLeft: "3mm" }}>Gender:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.gender}</span>
              </div>
            </div>

            {/* Row 3: Reg. No. & IPD No. */}
            <div style={dottedInputRowStyle}>
              <span style={inputLabelStyle}>Reg. No.:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.patientNumber}</span>
              </div>
              <span style={{ ...inputLabelStyle, marginLeft: "3mm" }}>IPD No.:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.ipdNumber}</span>
              </div>
            </div>

            {/* Row 4: Ward & Unit */}
            <div style={dottedInputRowStyle}>
              <span style={inputLabelStyle}>Ward:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.ward || "IPD-Gen"}</span>
              </div>
              <span style={{ ...inputLabelStyle, marginLeft: "3mm" }}>Unit:</span>
              <div style={{ ...dottedLineFillStyle, flex: "1" }}>
                <span style={roughHandwritingStyle}>{p.unit || "Unit-I"}</span>
              </div>
            </div>

            {/* Row 5: Consultant */}
            <div style={dottedInputRowStyle}>
              <span style={inputLabelStyle}>Counsultant:</span>
              <div style={dottedLineFillStyle}>
                <span style={roughHandwritingStyle}>{p.consultant || "Dr. Medical Specialist"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GENERAL EXAMINATION & VITAL SIGNS BOX                                     */}
        {/* ========================================================================= */}
        <div style={{ borderTop: "1.5px solid #000" }}>
          {/* Row 1: Vitals */}
          <div
            style={{
              padding: "1.5mm 2mm",
              fontSize: "8.5pt",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              rowGap: "1.2mm",
              borderBottom: "1px solid #000",
            }}
          >
            <span style={{ fontWeight: "bold", marginRight: "3mm" }}>GENERAL EXAMINATION:</span>
            <span style={{ fontWeight: "bold", marginRight: "3mm" }}>Vital Signs:</span>

            <span style={{ fontWeight: "600", marginRight: "1mm" }}>Temp:</span>
            <span style={{ ...dottedLineInlineStyle, width: "16mm" }}>
              <span style={roughHandwritingStyle}>{val("temp", "98.4 °F")}</span>
            </span>

            <span style={{ fontWeight: "600", marginLeft: "2mm", marginRight: "1mm" }}>Pulse:</span>
            <span style={{ ...dottedLineInlineStyle, width: "18mm" }}>
              <span style={roughHandwritingStyle}>{val("pulse", "78 /min")}</span>
            </span>

            <span style={{ fontWeight: "600", marginLeft: "2mm", marginRight: "1mm" }}>BP:</span>
            <span style={{ ...dottedLineInlineStyle, width: "22mm" }}>
              <span style={roughHandwritingStyle}>{val("bp", "120/80")}</span>
            </span>
            <span style={{ fontSize: "8pt", marginRight: "2mm" }}>Mmhg</span>

            <span style={{ fontWeight: "600", marginLeft: "1mm", marginRight: "1mm" }}>RR:</span>
            <span style={{ ...dottedLineInlineStyle, width: "16mm" }}>
              <span style={roughHandwritingStyle}>{val("rr", "18 /min")}</span>
            </span>

            <span style={{ fontWeight: "600", marginLeft: "2mm", marginRight: "1mm" }}>Wt:</span>
            <span style={{ ...dottedLineInlineStyle, width: "16mm" }}>
              <span style={roughHandwritingStyle}>{val("wt", "65")}</span>
            </span>
            <span style={{ fontSize: "8pt", marginRight: "2mm" }}>Kg.</span>

            <span style={{ fontWeight: "600", marginLeft: "1mm", marginRight: "1mm" }}>Height:</span>
            <span style={{ ...dottedLineInlineStyle, width: "18mm" }}>
              <span style={roughHandwritingStyle}>{val("height", "168")}</span>
            </span>
            <span style={{ fontSize: "8pt" }}>cms/Inch</span>
          </div>

          {/* Row 2: Pain Score & Location */}
          <div
            style={{
              padding: "1.2mm 2mm",
              fontSize: "8.5pt",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #000",
            }}
          >
            <span style={{ fontWeight: "600", marginRight: "1.5mm" }}>Pain Score:</span>
            <span style={{ ...dottedLineInlineStyle, width: "25mm" }}>
              <span style={roughHandwritingStyle}>{val("painScore", "2/10")}</span>
            </span>

            <span style={{ fontWeight: "600", marginLeft: "6mm", marginRight: "1.5mm" }}>Location:</span>
            <span style={{ ...dottedLineInlineStyle, flex: 1 }}>
              <span style={roughHandwritingStyle}>{val("painLocation", "None")}</span>
            </span>
          </div>

          {/* Row 3 & 4: General Exam Indicators Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "8.5pt",
              textAlign: "left",
            }}
          >
            <tbody>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <td style={{ ...examTdStyle, width: "33.3%" }}>
                  Pallor:{" "}
                  <span style={isPallorYes ? circledHandwritingStyle : unselectedStyle}>Yes</span> /{" "}
                  <span style={!isPallorYes ? circledHandwritingStyle : unselectedStyle}>No</span>
                </td>
                <td style={{ ...examTdStyle, width: "33.3%" }}>
                  Clubbing:{" "}
                  <span style={isClubbingYes ? circledHandwritingStyle : unselectedStyle}>Yes</span> /{" "}
                  <span style={!isClubbingYes ? circledHandwritingStyle : unselectedStyle}>No</span>
                </td>
                <td style={{ ...examTdStyle, width: "33.4%", borderRight: "none" }}>
                  Icterus:{" "}
                  <span style={isIcterusYes ? circledHandwritingStyle : unselectedStyle}>Yes</span> /{" "}
                  <span style={!isIcterusYes ? circledHandwritingStyle : unselectedStyle}>No</span>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <td style={examTdStyle}>
                  Edema:{" "}
                  <span style={isEdemaYes ? circledHandwritingStyle : unselectedStyle}>Yes</span> /{" "}
                  <span style={!isEdemaYes ? circledHandwritingStyle : unselectedStyle}>No</span>
                </td>
                <td style={examTdStyle}>
                  Emaciated:{" "}
                  <span style={isEmaciatedYes ? circledHandwritingStyle : unselectedStyle}>Yes</span> /{" "}
                  <span style={!isEmaciatedYes ? circledHandwritingStyle : unselectedStyle}>No</span>
                </td>
                <td style={{ ...examTdStyle, borderRight: "none" }}></td>
              </tr>
            </tbody>
          </table>

          {/* Row 5: Body Habitus */}
          <div
            style={{
              padding: "1.2mm 2mm",
              fontSize: "8.5pt",
              display: "flex",
              alignItems: "center",
              gap: "7mm",
              borderBottom: "1.5px solid #000",
            }}
          >
            <span style={{ fontWeight: "bold" }}>Body Habitus:</span>
            <span style={habitus.includes("obese") ? circledHandwritingStyle : unselectedStyle}>
              Obese
            </span>
            <span
              style={
                habitus.includes("average") || habitus.includes("normal")
                  ? circledHandwritingStyle
                  : unselectedStyle
              }
            >
              Average Built
            </span>
            <span style={habitus.includes("thin") ? circledHandwritingStyle : unselectedStyle}>
              Thin
            </span>
            <span style={habitus.includes("cachectic") ? circledHandwritingStyle : unselectedStyle}>
              Cachectic
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALLERGIES SECTION                                                         */}
        {/* ========================================================================= */}
        <div style={{ borderBottom: "1.5px solid #000", padding: "1.5mm 2mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "8.5pt", marginBottom: "1mm" }}>ALLERGIES:</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "8.5pt",
              gap: "8mm",
              marginBottom: "1mm",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5mm" }}>
              <span style={checkboxSquareStyle}>
                {allergies.includes("blood") ? "✓" : ""}
              </span>
              <span>Blood Transfusion</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5mm" }}>
              <span style={checkboxSquareStyle}>
                {allergies.includes("drug") ? "✓" : ""}
              </span>
              <span>Drug</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5mm" }}>
              <span style={checkboxSquareStyle}>
                {allergies.includes("food") ? "✓" : ""}
              </span>
              <span>Food &amp; Beverages</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5mm" }}>
              <span style={checkboxSquareStyle}>
                {!allergies.includes("blood") &&
                  !allergies.includes("drug") &&
                  !allergies.includes("food")
                  ? "✓"
                  : ""}
              </span>
              <span>None</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: "8.5pt", marginTop: "1mm" }}>
            <span style={checkboxSquareStyle}>
              {allergies.includes("other") || (!allergies.includes("none") && allergies.length > 5) ? "✓" : ""}
            </span>
            <span style={{ marginLeft: "1.5mm", marginRight: "1.5mm" }}>Other(Please Specify):</span>
            <div style={{ ...dottedLineFillStyle, flex: 1 }}>
              <span style={roughHandwritingStyle}>
                {allergies.includes("none") ? "—" : val("allergies")}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLINICAL NARRATIVE DOTTED SECTIONS                                        */}
        {/* ========================================================================= */}
        <div style={{ padding: "2mm 2.5mm" }}>
          {/* Chief Complaints: 4 lines */}
          {renderDottedSection(
            "Chief Complaints:",
            val("chiefComplaints", `1. Acute symptoms consistent with ${p.primaryDiagnosis}`),
            4
          )}

          {/* History of Presenting Illness (HOPI): 7 lines */}
          {renderDottedSection(
            "History of Presenting Illness (HOPI):",
            val(
              "hopi",
              `Patient presented with acute complaints related to ${p.primaryDiagnosis}. Symptom onset was gradual with progressive discomfort. Admitted for active clinical assessment and medical management.`
            ),
            7
          )}

          {/* Birth History: 3 lines */}
          {renderDottedSection(
            "Birth History:",
            val(
              "birthHistory",
              p.age < 18
                ? "Full-term normal vaginal delivery at hospital, birth weight normal, uneventful neonatal period."
                : "Full-term normal delivery, uneventful perinatal period, no known childhood or birth complications."
            ),
            3
          )}

          {/* Growth & Developmental History: 3 lines */}
          {renderDottedSection(
            "Growth & Developmental History:",
            val("growthDevelopment", "Normal developmental milestones attained for age. Physical and cognitive growth normal."),
            3
          )}

          {/* Immunization History: 3 lines */}
          {renderDottedSection(
            "Immunization History:",
            val("immunizationHistory", "Immunized for age as per National Immunization Schedule (NIS)."),
            3
          )}

          {/* Nutritional Growth & Development History: 3 lines */}
          {renderDottedSection(
            "Nutritional Growth & Development History:",
            val("nutritionalHistory", "Consumes regular balanced vegetarian/mixed diet. Appetite normal. No significant recent weight changes."),
            3
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE FOOTER                                                               */}
      {/* ========================================================================= */}
      <div style={footerRowStyle}>
        <div style={{ fontWeight: "600" }}>VSSH/DIAF/FORM/09</div>
        <div style={{ fontWeight: "600" }}>Page 1 of 4</div>
        <div style={{ fontWeight: "600" }}>Rev. 01/ June 2026</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles for A4 layout and rough real-handwriting appearance
// ---------------------------------------------------------------------------

const outerContainerStyle: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "7mm 9mm 6mm",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "9pt",
  lineHeight: "1.3",
  color: "#000",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};

const innerBorderStyle: React.CSSProperties = {
  border: "2px solid #000",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1.5px solid #000",
};

const topLeftBoxStyle: React.CSSProperties = {
  width: "44%",
  padding: "2.5mm 3mm",
  borderRight: "1.5px solid #000",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const topCenterBoxStyle: React.CSSProperties = {
  width: "16%",
  padding: "2mm",
  borderRight: "1.5px solid #000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const topRightBoxStyle: React.CSSProperties = {
  width: "40%",
  padding: "2mm 2.5mm",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
};

const dottedInputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  marginBottom: "1.2mm",
  fontSize: "8.5pt",
};

const inputLabelStyle: React.CSSProperties = {
  fontWeight: "bold",
  whiteSpace: "nowrap",
  marginRight: "1.5mm",
  color: "#111",
};

const dottedLineFillStyle: React.CSSProperties = {
  flex: 1,
  borderBottom: "1px dotted #444",
  paddingLeft: "1.5mm",
  minHeight: "4.5mm",
  display: "flex",
  alignItems: "flex-end",
  overflow: "hidden",
};

const dottedLineInlineStyle: React.CSSProperties = {
  display: "inline-flex",
  borderBottom: "1px dotted #444",
  paddingLeft: "1mm",
  minHeight: "4.2mm",
  alignItems: "flex-end",
  overflow: "hidden",
};

const examTdStyle: React.CSSProperties = {
  padding: "1.5mm 2mm",
  borderRight: "1px solid #000",
  fontWeight: "600",
};

const sectionHeaderTitleStyle: React.CSSProperties = {
  fontSize: "8.5pt",
  fontWeight: "bold",
  color: "#000",
  marginBottom: "0.2mm",
};

const checkboxSquareStyle: React.CSSProperties = {
  display: "inline-block",
  width: "3.2mm",
  height: "3.2mm",
  border: "1px solid #000",
  textAlign: "center",
  fontSize: "7pt",
  lineHeight: "3.2mm",
  fontWeight: "bold",
  color: "#083d8d",
};

const unselectedStyle: React.CSSProperties = {
  fontWeight: "normal",
  color: "#333",
};

// Rough real-handwriting styling for single-line demographic values
const roughHandwritingStyle: React.CSSProperties = {
  fontFamily: "'Kalam', cursive, sans-serif",
  color: "#083d8d", // Authentic ballpoint blue pen ink
  fontSize: "9.5pt",
  fontWeight: 500,
  letterSpacing: "0.015em",
  textShadow: "0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25)",
  filter: "contrast(115%) brightness(97%)",
  WebkitFontSmoothing: "subpixel-antialiased",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// Rough real-handwriting styling for multi-line narrative sections
const roughNarrativeHandwritingStyle: React.CSSProperties = {
  fontFamily: "'Kalam', cursive, sans-serif",
  color: "#083d8d",
  fontSize: "9.5pt",
  fontWeight: 500,
  letterSpacing: "0.015em",
  textShadow: "0.2px 0.2px 0.35px rgba(8, 61, 141, 0.4), -0.15px 0 0.2px rgba(8, 61, 141, 0.25)",
  filter: "contrast(115%) brightness(97%)",
  WebkitFontSmoothing: "subpixel-antialiased",
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  width: "100%",
};

const circledHandwritingStyle: React.CSSProperties = {
  ...roughHandwritingStyle,
  color: "#083d8d",
  fontWeight: "bold",
  border: "1.2px solid #083d8d",
  borderRadius: "50%",
  padding: "0.3mm 1.5mm",
  margin: "0 0.8mm",
  display: "inline-block",
};

const footerRowStyle: React.CSSProperties = {
  marginTop: "2mm",
  display: "flex",
  justifyContent: "space-between",
  fontSize: "8.5pt",
  color: "#111",
  padding: "0 1mm",
};
