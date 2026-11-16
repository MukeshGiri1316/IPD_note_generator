import { z } from "zod";

/**
 * Zod schema for Doctor Initial Assessment AI-generated content.
 * Matches all fields on the official hospital form (VSSH/DIAF/FORM/09).
 */
export const DoctorInitialAssessmentAISchema = z.object({
  // Vital Signs
  temp: z.string().default("98.4 °F").describe("Body temperature, e.g. 98.4 °F"),
  pulse: z.string().default("78 /min").describe("Pulse rate, e.g. 78 /min"),
  bp: z.string().default("120/80 mmHg").describe("Blood pressure, e.g. 120/80 mmHg"),
  rr: z.string().default("18 /min").describe("Respiratory rate, e.g. 18 /min"),
  wt: z.string().default("65 kg").describe("Weight in kg, e.g. 65 kg"),
  height: z.string().default("168 cm").describe("Height in cm or inches, e.g. 168 cm"),
  painScore: z.string().default("2/10").describe("Pain score 0-10 or None"),
  painLocation: z.string().default("Abdomen / None").describe("Location of pain if present"),

  // General Examination Yes/No indicators
  pallor: z.string().default("No").describe("Pallor: Yes or No"),
  clubbing: z.string().default("No").describe("Clubbing: Yes or No"),
  icterus: z.string().default("No").describe("Icterus: Yes or No"),
  edema: z.string().default("No").describe("Edema: Yes or No"),
  emaciated: z.string().default("No").describe("Emaciated: Yes or No"),
  bodyHabitus: z
    .string()
    .default("Average Built")
    .describe("One of: Obese, Average Built, Thin, Cachectic"),

  // Allergies
  allergies: z
    .string()
    .default("None")
    .describe("Allergies: None, Drug, Food & Beverages, Blood Transfusion, or specify"),

  // Clinical Narrative Sections
  chiefComplaints: z
    .string()
    .describe("Chief complaints in bullet points with duration, e.g. 1. Fever x 3 days..."),
  hopi: z
    .string()
    .describe("History of Presenting Illness (HOPI) clinical narrative"),
  birthHistory: z
    .string()
    .describe("Birth history: antenatal, natal details or uneventful for adult"),
  growthDevelopment: z
    .string()
    .describe("Growth and developmental milestones"),
  immunizationHistory: z
    .string()
    .describe("Immunization status as per schedule"),
  nutritionalHistory: z
    .string()
    .describe("Nutritional habits, diet, appetite, and weight stability"),
});

export type DoctorInitialAssessmentAIContent = z.infer<
  typeof DoctorInitialAssessmentAISchema
>;

export const DOCTOR_INITIAL_ASSESSMENT_PLACEHOLDERS = [
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
  "chiefComplaints",
  "hopi",
  "birthHistory",
  "growthDevelopment",
  "immunizationHistory",
  "nutritionalHistory",
] as const;

export type DoctorInitialAssessmentPlaceholder =
  (typeof DOCTOR_INITIAL_ASSESSMENT_PLACEHOLDERS)[number];
