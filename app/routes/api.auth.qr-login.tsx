/**
 * API Route: Login using QR code token
 * POST /api/auth/qr-login
 */

import { data } from "react-router";
import type { Route } from "./+types/api.auth.qr-login";
import { db } from "~/db/connection";
import { loginTokens, users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { createUserSession } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return data({ error: "Token is required" }, { status: 400 });
  }

  // Find token in database
  const [loginToken] = await db
    .select()
    .from(loginTokens)
    .where(eq(loginTokens.token, token))
    .limit(1);

  if (!loginToken) {
    return data({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Check if token is expired
  if (new Date() > loginToken.expiresAt) {
    return data({ error: "Token has expired" }, { status: 401 });
  }

  // Check if token was already used
  if (loginToken.used) {
    return data({ error: "Token has already been used" }, { status: 401 });
  }

  // Mark token as used
  await db
    .update(loginTokens)
    .set({ used: true })
    .where(eq(loginTokens.id, loginToken.id));

  // Get user details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, loginToken.userId))
    .limit(1);

  if (!user) {
    return data({ error: "User not found" }, { status: 404 });
  }

  // Create session and redirect
  return createUserSession({
    request,
    userId: user.id,
    email: user.email || undefined,
    redirectTo: "/",
  });
}
