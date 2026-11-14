import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { regenerateSection } from "@/lib/ai/generate-note";
import { DischargeSummaryInput } from "@/lib/ai/prompts/discharge-summary";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { admissionId, sectionKey, sectionLabel } = body;

    if (!admissionId || !sectionKey || !sectionLabel) {
      return NextResponse.json(
        { error: "admissionId, sectionKey, and sectionLabel are required" },
        { status: 400 }
      );
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { patient: true },
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    const aiInput: DischargeSummaryInput = {
      patientAge: admission.patient.age,
      patientGender: admission.patient.gender,
      primaryDiagnosis: admission.primaryDiagnosis,
      secondaryDiagnosis: admission.secondaryDiagnosis || undefined,
      symptoms: admission.symptoms || undefined,
      clinicalHistory: admission.clinicalHistory || undefined,
      examinationFindings: admission.examinationFindings || undefined,
      investigationDetails: (admission.investigationDetails as Record<string, unknown>) || undefined,
      treatmentDetails: admission.treatmentDetails || undefined,
      admissionDate: admission.admissionDate.toISOString().split("T")[0],
      dischargeDate: admission.dischargeDate ? admission.dischargeDate.toISOString().split("T")[0] : undefined,
    };

    const content = await regenerateSection(aiInput, sectionKey, sectionLabel);

    await createAuditLog({
      userId: session.userId,
      action: "AI_SECTION_REGENERATED",
      entityType: "Admission",
      entityId: admissionId,
      metadata: { sectionKey },
    });

    return NextResponse.json({
      success: true,
      sectionKey,
      content,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/generate-note/section error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate section" },
      { status: 500 }
    );
  }
}
