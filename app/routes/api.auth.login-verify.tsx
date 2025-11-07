/**
 * API Route: Verify Passkey Authentication
 * Called after user completes passkey authentication
 */

import { verifyPasskeyAuthentication, base64urlToUint8Array } from "~/lib/webauthn.server";
import { getSession } from "~/lib/session.server";
import { getCredentialById, getUserById, updateCredentialCounter } from "~/db/services/users";
import { createUserSession } from "~/lib/session.server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";

export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const response = body.credential as AuthenticationResponseJSON;

    // Get challenge from session
    const session = await getSession(request);
    const challenge = session.get("challenge");

    if (!challenge) {
      return Response.json({ error: "Invalid session. Please try again." }, { status: 400 });
    }

    // Clear challenge after retrieval to prevent reuse
    session.unset("challenge");

    // Get origin from request headers
    const origin = request.headers.get("origin") || new URL(request.url).origin;

    // Get credential from database
    const credentialRecord = await getCredentialById(response.id);

    if (!credentialRecord) {
      return Response.json({ error: "Credential not found" }, { status: 404 });
    }

    // Parse stored credential data
    const storedCredential = {
      id: credentialRecord.id,
      credentialID: credentialRecord.credentialId,
      publicKey: base64urlToUint8Array(credentialRecord.publicKey),
      counter: credentialRecord.counter,
      transports: credentialRecord.transports
        ? (credentialRecord.transports.split(",") as any)
        : undefined,
    };

    // Verify the authentication response
    const verification = await verifyPasskeyAuthentication(
      response,
      challenge,
      storedCredential,
      origin
    );

    if (!verification.verified) {
      return Response.json({ error: "Failed to verify passkey" }, { status: 400 });
    }

    // Update credential counter to prevent replay attacks
    await updateCredentialCounter(
      credentialRecord.credentialId,
      verification.authenticationInfo.newCounter
    );

    // Get user information
    const user = await getUserById(credentialRecord.userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Create session and redirect
    return createUserSession({
      request,
      userId: user.id,
      email: user.email || user.username || "user",
      redirectTo: "/",
    });
  } catch (error) {
    console.error("Failed to verify passkey login:", error);
    return Response.json(
      { error: "Failed to complete passkey login" },
      { status: 500 }
    );
  }
}
