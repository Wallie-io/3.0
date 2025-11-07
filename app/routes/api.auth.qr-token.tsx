/**
 * API Route: Generate temporary login token for QR code
 * POST /api/auth/qr-token
 */

import { data } from "react-router";
import type { Route } from "./+types/api.auth.qr-token";
import { db } from "~/db/connection";
import { loginTokens } from "~/db/schema";
import { requireUserId } from "~/lib/session.server";
import { nanoid } from "nanoid";

export async function action({ request }: Route.ActionArgs) {
  // Require authentication (mobile user must be logged in)
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const sessionId = formData.get("sessionId") as string | null;

  // Use provided sessionId or generate a new token
  const token = sessionId || nanoid(32);
  const tokenId = nanoid();

  // Token expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Save to database
  await db.insert(loginTokens).values({
    id: tokenId,
    userId,
    token,
    expiresAt,
    used: false,
  });

  return data({ token }, { status: 200 });
}
