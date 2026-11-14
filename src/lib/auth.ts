import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Password hashing (Node.js built-in scrypt — no extra dependency)
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });
}

// ---------------------------------------------------------------------------
// Session management (signed cookie — simple, no extra dependency)
// ---------------------------------------------------------------------------

export interface SessionPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

const SESSION_COOKIE = "ipd_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return secret;
}

/**
 * Encode session payload into a base64 string with an HMAC signature.
 */
function encodeSession(payload: SessionPayload): string {
  const { createHmac } = require("crypto") as typeof import("crypto");
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/**
 * Decode and verify a session token. Returns null if invalid.
 */
function decodeSession(token: string): SessionPayload | null {
  try {
    const { createHmac } = require("crypto") as typeof import("crypto");
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const expectedSig = createHmac("sha256", getSecret())
      .update(b64)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const json = Buffer.from(b64, "base64url").toString();
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Create a session for the user and set the cookie.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = encodeSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the current session from cookies. Returns null if not logged in.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/**
 * Destroy the current session.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Require an authenticated session. Throws if not logged in.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require a specific role. Throws if not authorized.
 */
export async function requireRole(
  ...roles: string[]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

