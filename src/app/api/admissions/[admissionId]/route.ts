import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdmissionUpdateSchema } from "@/lib/validation/admission";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { AdmissionStatus, Prisma } from "@prisma/client";

async function resolveAdmissionId(
  request: NextRequest,
  context?: { params?: Promise<{ admissionId: string }> | { admissionId: string } }
): Promise<string> {
  if (context?.params) {
    try {
      const resolved = await context.params;
      if (resolved && typeof resolved === "object" && "admissionId" in resolved) {
        if (resolved.admissionId) return resolved.admissionId;
      }
    } catch {
      // Fall through to URL extraction
    }
  }

  // Extract from URL path: /api/admissions/[admissionId]
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && last !== "admissions") {
    return last;
  }

  return "";
}

export async function GET(
  request: NextRequest,
  context?: { params?: Promise<{ admissionId: string }> | { admissionId: string } }
) {
  try {
    try {
      await requireSession();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admissionId = await resolveAdmissionId(request, context);

    if (!admissionId) {
      return NextResponse.json({ error: "admissionId is required" }, { status: 400 });
    }

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
    console.error("GET /api/admissions/[admissionId] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch admission" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context?: { params?: Promise<{ admissionId: string }> | { admissionId: string } }
) {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admissionId = await resolveAdmissionId(request, context);
    if (!admissionId) {
      return NextResponse.json({ error: "admissionId is required" }, { status: 400 });
    }

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
    console.error("PUT /api/admissions/[admissionId] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update admission" },
      { status: 500 }
    );
  }
}
