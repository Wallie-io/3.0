/**
 * WebAuthn Server Utilities
 * Handles passkey registration and verification on the server
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// WebAuthn configuration
const RP_NAME = "Wallie";
const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

export interface StoredCredential {
  id: string;
  credentialID: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

/**
 * Generate registration options for a new passkey
 */
export async function generatePasskeyRegistrationOptions(
  userId: string,
  username: string,
  existingCredentials: StoredCredential[] = []
) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(userId),
    userName: username,
    userDisplayName: username,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialID,
      type: "public-key",
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "discouraged", // More compatible with various devices
      // Allow any authenticator type (platform or cross-platform)
      // This allows security keys, phone authenticators, etc.
    },
  };

  return generateRegistrationOptions(opts);
}

/**
 * Verify passkey registration response
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  };

  return verifyRegistrationResponse(opts);
}

/**
 * Generate authentication options for passkey login
 */
export async function generatePasskeyAuthenticationOptions(
  userCredentials: StoredCredential[] = []
) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: RP_ID,
    userVerification: "discouraged", // More compatible with various devices
  };

  // If user has credentials, only allow those
  if (userCredentials.length > 0) {
    opts.allowCredentials = userCredentials.map((cred) => ({
      id: cred.credentialID,
      type: "public-key",
      transports: cred.transports,
    }));
  }

  return generateAuthenticationOptions(opts);
}

/**
 * Verify passkey authentication response
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: StoredCredential
): Promise<VerifiedAuthenticationResponse> {
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: credential.id,
      // @ts-expect-error - Type mismatch between SimpleWebAuthn Uint8Array types
      publicKey: credential.publicKey,
      counter: credential.counter,
    },
  };

  return verifyAuthenticationResponse(opts);
}

/**
 * Helper to convert base64url string to Uint8Array
 */
export function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to convert Uint8Array to base64url string
 */
export function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
