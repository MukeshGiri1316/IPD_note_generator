import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Only DOCTOR or ADMIN can approve clinical documents
    const session = await requireRole("DOCTOR", "ADMIN");
    const { documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status === "APPROVED") {
      return NextResponse.json({ error: "Document is already approved" }, { status: 400 });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "APPROVED",
        approvedById: session.userId,
        approvedAt: new Date(),
      },
      include: {
        approvedBy: {
          select: { name: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "DOCUMENT_APPROVED",
      entityType: "Document",
      entityId: documentId,
      metadata: { approvedBy: session.name, approvedAt: updated.approvedAt },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json(
          { error: "Forbidden: Only authorized clinicians (Doctors or Admins) can approve documents" },
          { status: 403 }
        );
      }
    }
    console.error("POST /api/documents/[documentId]/approve error:", error);
    return NextResponse.json({ error: "Failed to approve document" }, { status: 500 });
  }
}
