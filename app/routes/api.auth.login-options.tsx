/**
 * API Route: Generate Passkey Authentication Options
 * Called when user starts login process
 */

import { generatePasskeyAuthenticationOptions } from "~/lib/webauthn.server";
import { getSession, commitSession } from "~/lib/session.server";

export async function action({ request }: { request: Request }) {
  try {
    // Generate authentication options
    // For passkey login, we allow any registered credential
    const options = await generatePasskeyAuthenticationOptions([]);

    // Store challenge in session for verification
    const session = await getSession(request);
    session.set("challenge", options.challenge);

    return Response.json(
      { options },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate login options:", error);
    return Response.json(
      { error: "Failed to start passkey login" },
      { status: 500 }
    );
  }
}
