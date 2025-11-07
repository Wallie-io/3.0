/**
 * API Route: Poll for QR code login status
 * GET /api/auth/qr-poll?sessionId=xxx
 *
 * Desktop polls this endpoint to check if mobile has approved the login
 */

import { data } from "react-router";
import type { Route } from "./+types/api.auth.qr-poll";
import { db } from "~/db/connection";
import { loginTokens } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return data({ error: "Session ID is required" }, { status: 400 });
  }

  // Check if token exists with this sessionId
  const [loginToken] = await db
    .select()
    .from(loginTokens)
    .where(eq(loginTokens.token, sessionId))
    .limit(1);

  // If no token found, still pending
  if (!loginToken) {
    return data({ status: "pending" }, { status: 200 });
  }

  // Check if expired
  if (new Date() > loginToken.expiresAt) {
    return data({ status: "expired" }, { status: 200 });
  }

  // Check if already used
  if (loginToken.used) {
    return data({ status: "used" }, { status: 200 });
  }

  // Token exists and is ready to use
  return data({ status: "approved", token: loginToken.token }, { status: 200 });
}
