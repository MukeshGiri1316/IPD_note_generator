import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdmissionUpdateSchema } from "@/lib/validation/admission";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { AdmissionStatus, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ admissionId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const { admissionId } = await params;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: true,
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            template: {
              select: { name: true, slug: true },
            },
            createdBy: {
              select: { name: true, email: true },
            },
            approvedBy: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    return NextResponse.json({ admission });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admissions/[admissionId] error:", error);
    return NextResponse.json({ error: "Failed to fetch admission" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { admissionId } = await params;
    const body = await request.json();

    const parsed = AdmissionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existing = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    const data = parsed.data;

    const updated = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        ...(data.dischargeDate !== undefined && {
          dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
        }),
        ...(data.primaryDiagnosis !== undefined && { primaryDiagnosis: data.primaryDiagnosis }),
        ...(data.secondaryDiagnosis !== undefined && { secondaryDiagnosis: data.secondaryDiagnosis }),
        ...(data.clinicalHistory !== undefined && { clinicalHistory: data.clinicalHistory }),
        ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
        ...(data.examinationFindings !== undefined && { examinationFindings: data.examinationFindings }),
        ...(data.investigationDetails !== undefined && {
          investigationDetails: data.investigationDetails
            ? (data.investigationDetails as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(data.treatmentDetails !== undefined && { treatmentDetails: data.treatmentDetails }),
        ...(data.status !== undefined && { status: data.status as AdmissionStatus }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "ADMISSION_UPDATED",
      entityType: "Admission",
      entityId: admissionId,
      metadata: { status: updated.status, updatedFields: Object.keys(data) },
    });

    return NextResponse.json({ success: true, admission: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/admissions/[admissionId] error:", error);
    return NextResponse.json({ error: "Failed to update admission" }, { status: 500 });
  }
}
