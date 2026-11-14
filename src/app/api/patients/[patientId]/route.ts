import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PatientUpdateSchema } from "@/lib/validation/patient";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ patientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const { patientId } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        admissions: {
          orderBy: { admissionDate: "desc" },
          include: {
            documents: {
              select: {
                id: true,
                noteType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/patients/[patientId] error:", error);
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { patientId } = await params;
    const body = await request.json();

    const parsed = PatientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const { name, age, gender, dateOfBirth, phone, address } = parsed.data;

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age }),
        ...(gender !== undefined && { gender }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "PATIENT_UPDATED",
      entityType: "Patient",
      entityId: patientId,
      metadata: { updatedFields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ success: true, patient: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/patients/[patientId] error:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
