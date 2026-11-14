import { z } from "zod";

export const PatientCreateSchema = z.object({
  patientNumber: z.string().min(1, "Patient number is required"),
  name: z.string().min(1, "Patient name is required"),
  age: z.number().int().positive("Age must be a positive integer"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export type PatientCreateInput = z.infer<typeof PatientCreateSchema>;

export const PatientUpdateSchema = PatientCreateSchema.partial().omit({
  patientNumber: true,
});

export type PatientUpdateInput = z.infer<typeof PatientUpdateSchema>;
