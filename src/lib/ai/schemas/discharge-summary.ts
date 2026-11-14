import { z } from "zod";

/**
 * Zod schema for the AI-generated discharge summary content.
 * Each field corresponds to a section placeholder in the template.
 */
export const DischargeSummaryAISchema = z.object({
  clinicalHistory: z
    .string()
    .describe("Brief clinical history based on provided information"),
  examination: z
    .string()
    .describe("Examination findings summary"),
  investigationSummary: z
    .string()
    .describe("Summary of investigations performed"),
  hospitalCourse: z
    .string()
    .describe("Course of treatment during hospital stay"),
  conditionAtDischarge: z
    .string()
    .describe("Patient condition at the time of discharge"),
  dischargeAdvice: z
    .string()
    .describe("Discharge advice and follow-up instructions"),
});

export type DischargeSummaryAIContent = z.infer<
  typeof DischargeSummaryAISchema
>;

/**
 * All placeholder keys used in the discharge summary template.
 */
export const DISCHARGE_SUMMARY_PLACEHOLDERS = [
  "clinicalHistory",
  "examination",
  "investigationSummary",
  "hospitalCourse",
  "conditionAtDischarge",
  "dischargeAdvice",
] as const;

export type DischargeSummaryPlaceholder =
  (typeof DISCHARGE_SUMMARY_PLACEHOLDERS)[number];

