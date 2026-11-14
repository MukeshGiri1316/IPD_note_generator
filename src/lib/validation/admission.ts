import { z } from "zod";

export const AdmissionCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  ipdNumber: z.string().min(1, "IPD number is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  dischargeDate: z.string().optional().nullable(),
  primaryDiagnosis: z.string().min(1, "Primary diagnosis is required"),
  secondaryDiagnosis: z.string().optional().nullable(),
  clinicalHistory: z.string().optional().nullable(),
  symptoms: z.string().optional().nullable(),
  examinationFindings: z.string().optional().nullable(),
  investigationDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  treatmentDetails: z.string().optional().nullable(),
});

export type AdmissionCreateInput = z.infer<typeof AdmissionCreateSchema>;

export const AdmissionUpdateSchema = z.object({
  dischargeDate: z.string().optional().nullable(),
  primaryDiagnosis: z.string().optional(),
  secondaryDiagnosis: z.string().optional().nullable(),
  clinicalHistory: z.string().optional().nullable(),
  symptoms: z.string().optional().nullable(),
  examinationFindings: z.string().optional().nullable(),
  investigationDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  treatmentDetails: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "DISCHARGED", "TRANSFERRED"]).optional(),
});

export type AdmissionUpdateInput = z.infer<typeof AdmissionUpdateSchema>;
