import { NoteType } from "@prisma/client";
import { ComponentType } from "react";
import { DISCHARGE_SUMMARY_PLACEHOLDERS } from "@/lib/ai/schemas/discharge-summary";

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
};

/**
 * Get all active templates.
 */
export function getActiveTemplates(): NoteTemplate[] {
  return Object.values(TEMPLATES);
}

/**
 * Get a template by its key.
 */
export function getTemplateByKey(key: string): NoteTemplate | undefined {
  return TEMPLATES[key];
}

/**
 * Section labels for UI display.
 */
export const SECTION_LABELS: Record<string, string> = {
  clinicalHistory: "Clinical History",
  examination: "Examination",
  investigationSummary: "Investigation Summary",
  hospitalCourse: "Hospital Course",
  conditionAtDischarge: "Condition at Discharge",
  dischargeAdvice: "Discharge Advice",
};

