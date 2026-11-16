import { NoteType } from "@prisma/client";
import { DISCHARGE_SUMMARY_PLACEHOLDERS } from "@/lib/ai/schemas/discharge-summary";
import { DOCTOR_INITIAL_ASSESSMENT_PLACEHOLDERS } from "@/lib/ai/schemas/doctor-initial-assessment";

// ---------------------------------------------------------------------------
// Template type definitions
// ---------------------------------------------------------------------------

export interface NoteTemplate {
  id: string;
  name: string;
  noteType: NoteType;
  version: number;
  componentKey: string;
  placeholders: readonly string[];
  description: string;
}

/**
 * Props passed to every template React component.
 */
export interface TemplateProps {
  patientData: {
    name: string;
    age: number;
    gender: string;
    patientNumber: string;
    ipdNumber: string;
    admissionDate: string;
    dischargeDate?: string;
    primaryDiagnosis: string;
    secondaryDiagnosis?: string;
    ward?: string;
    unit?: string;
    consultant?: string;
  };
  generatedContent: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const TEMPLATES: Record<string, NoteTemplate> = {
  "discharge-summary": {
    id: "discharge-summary",
    name: "Discharge Summary",
    noteType: "DISCHARGE_SUMMARY" as NoteType,
    version: 1,
    componentKey: "discharge-summary",
    placeholders: DISCHARGE_SUMMARY_PLACEHOLDERS,
    description:
      "Standard discharge summary for IPD patients including clinical history, examination, hospital course, and discharge advice.",
  },
  "doctor-initial-assessment": {
    id: "doctor-initial-assessment",
    name: "Doctor Initial Assessment",
    noteType: "DOCTOR_INITIAL_ASSESSMENT" as NoteType,
    version: 1,
    componentKey: "doctor-initial-assessment",
    placeholders: DOCTOR_INITIAL_ASSESSMENT_PLACEHOLDERS,
    description:
      "Official inpatient Doctor Initial Assessment form (VSSH/DIAF/FORM/09) including vitals, general exam, allergies, chief complaints, HOPI, and developmental/nutritional history.",
  },
};

/**
 * Get all active templates.
 */
export function getActiveTemplates(): NoteTemplate[] {
  return Object.values(TEMPLATES);
}

/**
 * Get a template by its key or slug.
 */
export function getTemplateByKey(key: string): NoteTemplate | undefined {
  return TEMPLATES[key];
}

/**
 * Section labels for UI display.
 */
export const SECTION_LABELS: Record<string, string> = {
  // Discharge Summary
  clinicalHistory: "Clinical History",
  examination: "Examination",
  investigationSummary: "Investigation Summary",
  hospitalCourse: "Hospital Course",
  conditionAtDischarge: "Condition at Discharge",
  dischargeAdvice: "Discharge Advice",

  // Doctor Initial Assessment
  temp: "Body Temperature",
  pulse: "Pulse Rate",
  bp: "Blood Pressure",
  rr: "Respiratory Rate",
  wt: "Weight",
  height: "Height",
  painScore: "Pain Score",
  painLocation: "Pain Location",
  pallor: "Pallor",
  clubbing: "Clubbing",
  icterus: "Icterus",
  edema: "Edema",
  emaciated: "Emaciated",
  bodyHabitus: "Body Habitus",
  allergies: "Allergies",
  chiefComplaints: "Chief Complaints",
  hopi: "History of Presenting Illness (HOPI)",
  birthHistory: "Birth History",
  growthDevelopment: "Growth & Developmental History",
  immunizationHistory: "Immunization History",
  nutritionalHistory: "Nutritional Growth & Development History",
};

/**
 * Ordered sections for each template in the editor.
 */
export const TEMPLATE_SECTIONS: Record<string, string[]> = {
  "discharge-summary": [
    "clinicalHistory",
    "examination",
    "investigationSummary",
    "hospitalCourse",
    "conditionAtDischarge",
    "dischargeAdvice",
  ],
  "doctor-initial-assessment": [
    // Narrative sections (primary focus for editor)
    "chiefComplaints",
    "hopi",
    "birthHistory",
    "growthDevelopment",
    "immunizationHistory",
    "nutritionalHistory",
    // Vitals and Exam
    "temp",
    "pulse",
    "bp",
    "rr",
    "wt",
    "height",
    "painScore",
    "painLocation",
    "pallor",
    "clubbing",
    "icterus",
    "edema",
    "emaciated",
    "bodyHabitus",
    "allergies",
  ],
};
