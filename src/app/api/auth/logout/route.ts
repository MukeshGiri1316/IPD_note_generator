import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await createAuditLog({
        userId: session.userId,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: session.userId,
      });
    }

    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
