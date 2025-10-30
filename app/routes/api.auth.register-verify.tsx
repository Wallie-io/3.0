/**
 * API Route: Verify Passkey Registration
 * Called after user completes passkey creation
 */

import { verifyPasskeyRegistration, uint8ArrayToBase64url } from "~/lib/webauthn.server";
import { getSession } from "~/lib/session.server";
import { createUser, createCredential, createProfile } from "~/lib/db.client";
import { createUserSession } from "~/lib/session.server";
import type { RegistrationResponseJSON } from "@simplewebauthn/browser";

export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const response = body.credential as RegistrationResponseJSON;

    // Get challenge and user data from session
    const session = await getSession(request);
    const challenge = session.get("challenge");
    const userId = session.get("userId");
    const username = session.get("username");

    if (!challenge || !userId || !username) {
      return Response.json({ error: "Invalid session. Please try again." }, { status: 400 });
    }

    // Verify the registration response
    const verification = await verifyPasskeyRegistration(response, challenge);

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json({ error: "Failed to verify passkey" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    const credentialID = credential.id;
    const publicKey = credential.publicKey;
    const counter = credential.counter;

    // Store user in local database
    await createUser(userId, username);

    // Create default profile
    await createProfile(userId, username);

    // Store credential in local database
    await createCredential(
      userId,
      credentialID,
      uint8ArrayToBase64url(publicKey),
      counter,
      response.response.transports
    );

    // Create session and redirect
    return createUserSession({
      request,
      userId,
      email: username, // Using username as email for now
      redirectTo: "/",
    });
  } catch (error) {
    console.error("Failed to verify passkey registration:", error);
    return Response.json(
      { error: "Failed to complete passkey registration" },
      { status: 500 }
    );
  }
}
