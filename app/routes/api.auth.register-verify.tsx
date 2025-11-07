/**
 * API Route: Verify Passkey Registration
 * Called after user completes passkey creation
 */

import { verifyPasskeyRegistration, uint8ArrayToBase64url } from "~/lib/webauthn.server";
import { getSession } from "~/lib/session.server";
import { createUser, createProfile, createCredential } from "~/db/services/users";
import { createUserSession } from "~/lib/session.server";
import { useInviteCode } from "~/db/services/invites";
import { followUser } from "~/db/services/connections";
import type { RegistrationResponseJSON } from "@simplewebauthn/browser";
import { nanoid } from "nanoid";

export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const response = body.credential as RegistrationResponseJSON;

    // Get challenge and user data from session
    const session = await getSession(request);
    const challenge = session.get("challenge");
    const userId = session.get("tempUserId"); // Get temp userId from registration
    const username = session.get("username");
    const referralCode = session.get("referralCode");

    if (!challenge || !userId || !username) {
      return Response.json({ error: "Invalid session. Please try again." }, { status: 400 });
    }

    // Clear temporary registration data
    session.unset("challenge");
    session.unset("tempUserId");
    session.unset("username");
    session.unset("referralCode");

    // Get origin from request headers
    const origin = request.headers.get("origin") || new URL(request.url).origin;

    // Verify the registration response
    const verification = await verifyPasskeyRegistration(response, challenge, origin);

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json({ error: "Failed to verify passkey" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    const credentialID = credential.id;
    const publicKey = credential.publicKey;
    const counter = credential.counter;

    // Store user in database
    await createUser({
      id: userId,
      username: username,
      email: username, // Using username as email for now
      theme: "system",
    });

    // Create default profile
    await createProfile({
      userId: userId,
      displayName: username,
    });

    // Store credential in database
    await createCredential({
      id: nanoid(),
      userId: userId,
      credentialId: credentialID,
      publicKey: uint8ArrayToBase64url(publicKey),
      counter: counter,
      transports: response.response.transports?.join(","),
    });

    // Process referral if code was provided
    if (referralCode) {
      try {
        // Mark invite code as used and create referral record
        const referral = await useInviteCode(referralCode, userId);

        // Automatically follow the referrer
        await followUser(userId, referral.referrerId);

        console.log(`User ${userId} was referred by ${referral.referrerId} via code ${referralCode}`);
      } catch (error) {
        // Log error but don't fail the signup
        console.error("Failed to process referral:", error);
      }
    }

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
