import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PatientCreateSchema } from "@/lib/validation/patient";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const whereClause = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { patientNumber: { contains: q, mode: "insensitive" as const } },
            {
              admissions: {
                some: {
                  ipdNumber: { contains: q, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        include: {
          admissions: {
            orderBy: { admissionDate: "desc" },
            take: 1,
            select: {
              id: true,
              ipdNumber: true,
              status: true,
              admissionDate: true,
              primaryDiagnosis: true,
            },
          },
          _count: {
            select: { admissions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = PatientCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { patientNumber, name, age, gender, dateOfBirth, phone, address } = parsed.data;

    const existing = await prisma.patient.findUnique({
      where: { patientNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Patient with number "${patientNumber}" already exists` },
        { status: 409 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        patientNumber,
        name,
        age,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone: phone || null,
        address: address || null,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "PATIENT_CREATED",
      entityType: "Patient",
      entityId: patient.id,
      metadata: { patientNumber: patient.patientNumber, name: patient.name },
    });

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
