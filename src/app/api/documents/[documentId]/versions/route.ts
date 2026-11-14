import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSession();
    const { documentId } = await params;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      include: {
        modifiedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/documents/[documentId]/versions error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
