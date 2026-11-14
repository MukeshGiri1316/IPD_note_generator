import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { DocumentStatus, NoteType, Prisma } from "@prisma/client";
import { ensureDefaultTemplates } from "@/lib/seed-template";

export async function GET(request: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const admissionId = searchParams.get("admissionId");
    const status = searchParams.get("status") as DocumentStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.DocumentWhereInput = {
      ...(admissionId && { admissionId }),
      ...(status && { status }),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          admission: {
            include: {
              patient: {
                select: { name: true, patientNumber: true },
              },
            },
          },
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      documents,
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
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    await ensureDefaultTemplates();

    const body = await request.json();
    const {
      admissionId,
      templateSlug = "discharge-summary",
      generatedContent,
      finalContent,
      status = "DRAFT",
    } = body;

    if (!admissionId || !generatedContent || !finalContent) {
      return NextResponse.json(
        { error: "admissionId, generatedContent, and finalContent are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create Document and its first DocumentVersion inside a transaction
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          admissionId,
          templateId: template.id,
          createdById: session.userId,
          noteType: template.noteType,
          generatedContent: generatedContent as Prisma.InputJsonValue,
          finalContent: finalContent as Prisma.InputJsonValue,
          templateVersion: template.version,
          status: status as DocumentStatus,
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          content: finalContent as Prisma.InputJsonValue,
          changeDescription: "Initial creation / draft",
          modifiedById: session.userId,
        },
      });

      return doc;
    });

    await createAuditLog({
      userId: session.userId,
      action: "DOCUMENT_CREATED",
      entityType: "Document",
      entityId: document.id,
      metadata: { admissionId, status: document.status },
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
