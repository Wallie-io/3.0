/**
 * API Route: Generate Passkey Registration Options
 * Called when user starts signup process
 */

import { generatePasskeyRegistrationOptions } from "~/lib/webauthn.server";
import { getSession, commitSession } from "~/lib/session.server";

export async function action({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const username = formData.get("username") as string;
    const referralCode = formData.get("referralCode") as string | null;

    // Generate unique user ID if username not provided
    const userId = crypto.randomUUID();
    const displayName = username || `user_${userId.slice(0, 8)}`;

    // Get origin from request headers
    const origin = request.headers.get("origin") || new URL(request.url).origin;

    // Generate registration options
    const options = await generatePasskeyRegistrationOptions(
      userId,
      displayName,
      [], // No existing credentials for new user
      origin
    );

    // Store challenge and user data in session for verification
    // Use tempUserId to avoid making user appear logged in before verification
    const session = await getSession(request);
    session.set("challenge", options.challenge);
    session.set("tempUserId", userId);
    session.set("username", displayName);

    // Store referral code if provided
    if (referralCode) {
      session.set("referralCode", referralCode);
    }

    return Response.json(
      { options, userId, username: displayName },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate registration options:", error);
    return Response.json(
      { error: "Failed to start passkey registration" },
      { status: 500 }
    );
  }
}
