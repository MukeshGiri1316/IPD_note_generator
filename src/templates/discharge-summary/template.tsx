import React from "react";
import { TemplateProps } from "../registry";

/**
 * Discharge Summary React template — used for browser preview.
 *
 * Fixed values: hospital name, headings, section labels, layout.
 * Patient placeholders & AI content: rendered in handwriting font (Kalam) with blue pen ink color (#084298).
 */
export default function DischargeSummaryTemplate({
  patientData,
  generatedContent,
}: TemplateProps) {
  const p = patientData;
  const c = generatedContent;

  return (
    <div style={pageStyle}>
      {/* Hospital Header */}
      <div style={headerStyle}>
        <h1 style={hospitalNameStyle}>VYAS SUPERSPECIALITY HOSPITAL</h1>
        <p style={hospitalSubStyle}>
          123 Medical Road, City — Phone: 0123-456789
        </p>
      </div>

      {/* Document Title */}
      <div style={titleBarStyle}>
        <h2 style={titleStyle}>DISCHARGE SUMMARY</h2>
      </div>

      {/* Patient Information Grid */}
      <table style={infoTableStyle}>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Patient Name</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>{p.name}</td>
            <td style={labelCellStyle}>IPD No.</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>{p.ipdNumber}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Age / Gender</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>
              {p.age} yrs / {p.gender}
            </td>
            <td style={labelCellStyle}>Reg. No.</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>{p.patientNumber}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Date of Admission</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>{p.admissionDate}</td>
            <td style={labelCellStyle}>Date of Discharge</td>
            <td style={colonStyle}>:</td>
            <td style={valueCellStyle}>{p.dischargeDate || "—"}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Diagnosis</td>
            <td style={colonStyle}>:</td>
            <td colSpan={4} style={valueCellStyle}>
              {p.primaryDiagnosis}
              {p.secondaryDiagnosis ? ` / ${p.secondaryDiagnosis}` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Clinical Sections (Rendered in handwriting font with blue pen writing color) */}
      <Section title="Clinical History" content={c.clinicalHistory} />
      <Section title="Examination" content={c.examination} />
      <Section title="Investigation Summary" content={c.investigationSummary} />
      <Section title="Hospital Course" content={c.hospitalCourse} />
      <Section
        title="Condition at Discharge"
        content={c.conditionAtDischarge}
      />
      <Section title="Discharge Advice" content={c.dischargeAdvice} />

      {/* Footer */}
      <div style={footerStyle}>
        <div style={sigBlockStyle}>
          <div style={sigLineStyle} />
          <p style={sigLabelStyle}>Treating Doctor</p>
        </div>
        <div style={sigBlockStyle}>
          <div style={sigLineStyle} />
          <p style={sigLabelStyle}>Consultant</p>
        </div>
      </div>

      <p style={aiDisclaimerStyle}>
        ⚕ AI-assisted draft — must be reviewed and approved by an authorized
        clinician before finalization.
      </p>
    </div>
  );
}

/** A single titled section. */
function Section({ title, content }: { title: string; content?: string }) {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <p style={sectionContentStyle}>{content || "—"}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline for PDF & preview fidelity)
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "10mm 14mm",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "10pt",
  lineHeight: "1.4",
  color: "#000",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  borderBottom: "2px solid #000",
  paddingBottom: "3mm",
  marginBottom: "3mm",
};

const hospitalNameStyle: React.CSSProperties = {
  fontSize: "16pt",
  fontWeight: "bold",
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: 0,
};

const hospitalSubStyle: React.CSSProperties = {
  fontSize: "9pt",
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: 0,
  color: "#333",
};

const titleBarStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "2mm 0 3mm",
};

const titleStyle: React.CSSProperties = {
  fontSize: "13pt",
  fontWeight: "bold",
  fontFamily: "Arial, Helvetica, sans-serif",
  textDecoration: "underline",
  margin: 0,
};

const infoTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "4mm",
  border: "1px solid #000",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "9pt",
};

const labelCellStyle: React.CSSProperties = {
  fontWeight: "bold",
  padding: "1.5mm 2mm",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #ccc",
  color: "#000",
};

const colonStyle: React.CSSProperties = {
  padding: "1.5mm 1mm",
  textAlign: "center",
  borderBottom: "1px solid #ccc",
  color: "#000",
};

// Hand-written blue pen ink style for patient details
const valueCellStyle: React.CSSProperties = {
  padding: "1.5mm 2mm",
  borderBottom: "1px solid #ccc",
  fontFamily: "'Kalam', 'Segoe UI', Arial, sans-serif",
  color: "#084298", // Medical blue pen ink
  fontSize: "10pt",
  fontWeight: "500",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "3mm",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "10pt",
  fontWeight: "bold",
  fontFamily: "Arial, Helvetica, sans-serif",
  borderBottom: "1px solid #000",
  paddingBottom: "1mm",
  marginBottom: "1.5mm",
  margin: 0,
  color: "#000",
};

// Hand-written blue pen ink style for clinical entries
const sectionContentStyle: React.CSSProperties = {
  margin: "1mm 0 0 0",
  whiteSpace: "pre-wrap",
  fontFamily: "'Kalam', 'Segoe UI', Arial, sans-serif",
  color: "#084298", // Medical blue pen ink
  fontSize: "10.5pt",
  lineHeight: "1.45",
};

const footerStyle: React.CSSProperties = {
  marginTop: "auto",
  display: "flex",
  justifyContent: "space-between",
  paddingTop: "8mm",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const sigBlockStyle: React.CSSProperties = {
  width: "35%",
  textAlign: "center",
};

const sigLineStyle: React.CSSProperties = {
  borderBottom: "1px solid #000",
  marginBottom: "2mm",
  height: "8mm",
};

const sigLabelStyle: React.CSSProperties = {
  fontSize: "9pt",
  margin: 0,
};

const aiDisclaimerStyle: React.CSSProperties = {
  fontSize: "7pt",
  color: "#666",
  textAlign: "center",
  marginTop: "3mm",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontStyle: "italic",
};
