import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdmissionCreateSchema } from "@/lib/validation/admission";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = AdmissionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check duplicate IPD number
    const existing = await prisma.admission.findUnique({
      where: { ipdNumber: data.ipdNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Admission with IPD number "${data.ipdNumber}" already exists` },
        { status: 409 }
      );
    }

    const admission = await prisma.admission.create({
      data: {
        patientId: data.patientId,
        ipdNumber: data.ipdNumber,
        admissionDate: new Date(data.admissionDate),
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
        primaryDiagnosis: data.primaryDiagnosis,
        secondaryDiagnosis: data.secondaryDiagnosis || null,
        clinicalHistory: data.clinicalHistory || null,
        symptoms: data.symptoms || null,
        examinationFindings: data.examinationFindings || null,
        investigationDetails: data.investigationDetails
          ? (data.investigationDetails as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        treatmentDetails: data.treatmentDetails || null,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "ADMISSION_CREATED",
      entityType: "Admission",
      entityId: admission.id,
      metadata: { ipdNumber: admission.ipdNumber, patientId: admission.patientId },
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/admissions error:", error);
    return NextResponse.json({ error: "Failed to create admission" }, { status: 500 });
  }
}
