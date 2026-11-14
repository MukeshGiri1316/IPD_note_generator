import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { DocumentStatus, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const { documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        admission: {
          include: {
            patient: true,
          },
        },
        template: true,
        createdBy: {
          select: { name: true, email: true, role: true },
        },
        approvedBy: {
          select: { name: true, email: true, role: true },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            modifiedBy: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/documents/[documentId] error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { documentId } = await params;
    const body = await request.json();
    const { finalContent, changeDescription, status } = body;

    if (!finalContent) {
      return NextResponse.json({ error: "finalContent is required" }, { status: 400 });
    }

    const currentDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!currentDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (currentDoc.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved documents cannot be edited. Create a revision or draft." },
        { status: 400 }
      );
    }

    const nextVersionNumber = (currentDoc.versions[0]?.versionNumber || 0) + 1;

    const updated = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id: documentId },
        data: {
          finalContent: finalContent as Prisma.InputJsonValue,
          ...(status && { status: status as DocumentStatus }),
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersionNumber,
          content: finalContent as Prisma.InputJsonValue,
          changeDescription: changeDescription || `Version ${nextVersionNumber}`,
          modifiedById: session.userId,
        },
      });

      return doc;
    });

    await createAuditLog({
      userId: session.userId,
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: documentId,
      metadata: { newVersion: nextVersionNumber, status: updated.status },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/documents/[documentId] error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
