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

/**
 * Get RP_ID based on the request origin
 * WebAuthn requires the RP_ID to match the domain
 */
function getRPIDFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return process.env.RP_ID || "localhost";
  }
}

/**
 * Get list of allowed origins for WebAuthn
 */
function getAllowedOrigins(): string[] {
  const origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://192.168.7.35:5173",
    "http://192.168.7.35:5174",
  ];

  // Add custom origin from env if provided
  if (process.env.ORIGIN) {
    origins.push(process.env.ORIGIN);
  }

  return origins;
}

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
  existingCredentials: StoredCredential[] = [],
  origin?: string
) {
  const rpID = origin ? getRPIDFromOrigin(origin) : (process.env.RP_ID || "localhost");

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID,
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
  expectedChallenge: string,
  origin?: string
): Promise<VerifiedRegistrationResponse> {
  const expectedOrigin = origin || process.env.ORIGIN || "http://localhost:5173";
  const expectedRPID = getRPIDFromOrigin(expectedOrigin);

  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: getAllowedOrigins(),
    expectedRPID,
  };

  return verifyRegistrationResponse(opts);
}

/**
 * Generate authentication options for passkey login
 */
export async function generatePasskeyAuthenticationOptions(
  userCredentials: StoredCredential[] = [],
  origin?: string
) {
  const rpID = origin ? getRPIDFromOrigin(origin) : (process.env.RP_ID || "localhost");

  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
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
  credential: StoredCredential,
  origin?: string
): Promise<VerifiedAuthenticationResponse> {
  const expectedOrigin = origin || process.env.ORIGIN || "http://localhost:5173";
  const expectedRPID = getRPIDFromOrigin(expectedOrigin);

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: getAllowedOrigins(),
    expectedRPID,
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
