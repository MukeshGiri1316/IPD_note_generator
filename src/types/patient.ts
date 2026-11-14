import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const labValue = z.union([z.string(), z.number()]).optional();

export const PatientSchema = z.object({
  // Required
  patientId: z.string().min(1, "Patient ID is required"),
  name: z.string().min(1, "Patient name is required"),
  age: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  gender: z.string().min(1, "Gender is required"),
  date: z.string().min(1, "Date is required"),

  // Optional patient info
  accessionNo: z.string().optional(),
  billIpdNo: z.string().optional(),
  opdIpd: z.string().optional(),
  department: z.string().optional(),
  doctorName: z.string().optional(),
  location: z.string().optional(),

  // Haematology results
  wbc: labValue,
  neutrophils: labValue,
  lymphocytes: labValue,
  monocytes: labValue,
  eosinophils: labValue,
  basophils: labValue,
  rbcCount: labValue,
  hb: labValue,
  hct: labValue,
  mcv: labValue,
  mch: labValue,
  mchc: labValue,
  rdwCv: labValue,
  plateletCount: labValue,
  mpv: labValue,

  // Serology
  hbsag: z.string().optional(),
});

export type Patient = z.infer<typeof PatientSchema>;

// ---------------------------------------------------------------------------
// Default values used by the lab report renderer
// ---------------------------------------------------------------------------

export const DEFAULT_PATIENT_VALUES = {
  opdIpd: "OPD",
  department: "GENERAL MEDICINE",
  location: "/",
} as const;

// ---------------------------------------------------------------------------
// Excel column mapping
// ---------------------------------------------------------------------------

export const REQUIRED_EXCEL_COLUMNS = [
  "patient_name",
  "patient_id",
  "age",
  "gender",
  "date",
] as const;

export const OPTIONAL_EXCEL_COLUMNS = [
  "accession_no",
  "bill_ipd_no",
  "opd_ipd",
  "department",
  "doctor_name",
  "location",
  "wbc",
  "neutrophils",
  "lymphocytes",
  "monocytes",
  "eosinophils",
  "basophils",
  "rbc_count",
  "hb",
  "hct",
  "mcv",
  "mch",
  "mchc",
  "rdw_cv",
  "platelet_count",
  "mpv",
  "hbsag",
] as const;

/**
 * Maps lowercase Excel column names → Patient field names (camelCase).
 */
export const EXCEL_COLUMN_MAP: Record<string, string> = {
  patient_name: "name",
  patient_id: "patientId",
  age: "age",
  gender: "gender",
  date: "date",
  accession_no: "accessionNo",
  bill_ipd_no: "billIpdNo",
  opd_ipd: "opdIpd",
  department: "department",
  doctor_name: "doctorName",
  location: "location",
  wbc: "wbc",
  neutrophils: "neutrophils",
  lymphocytes: "lymphocytes",
  monocytes: "monocytes",
  eosinophils: "eosinophils",
  basophils: "basophils",
  rbc_count: "rbcCount",
  hb: "hb",
  hct: "hct",
  mcv: "mcv",
  mch: "mch",
  mchc: "mchc",
  rdw_cv: "rdwCv",
  platelet_count: "plateletCount",
  mpv: "mpv",
  hbsag: "hbsag",
};

