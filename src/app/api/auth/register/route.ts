import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validation/auth";
import { hashPassword, createSession, getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Count existing users: if 0 users, first user automatically becomes ADMIN
    const userCount = await prisma.user.count();
    let assignedRole: UserRole = UserRole.STAFF;

    if (userCount === 0) {
      assignedRole = UserRole.ADMIN;
    } else {
      // If other users exist, verify if caller is an ADMIN
      const currentSession = await getSession();
      if (!currentSession || currentSession.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only administrators can create new users" },
          { status: 403 }
        );
      }
      assignedRole = (role as UserRole) || UserRole.STAFF;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: assignedRole,
      },
    });

    // If first user, automatically create session
    if (userCount === 0) {
      await createSession({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      });
    }

    await createAuditLog({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
