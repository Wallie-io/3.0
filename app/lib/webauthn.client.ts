/**
 * WebAuthn Client Utilities
 * Handles passkey registration and authentication in the browser
 */

import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

/**
 * Start passkey registration flow
 */
export async function registerPasskey(
  options: PublicKeyCredentialCreationOptionsJSON
) {
  try {
    const credential = await startRegistration({ optionsJSON: options });
    return { success: true, credential };
  } catch (error) {
    console.error("Passkey registration failed:", error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.name === "InvalidStateError") {
        return {
          success: false,
          error: "This passkey is already registered. Please use a different one.",
        };
      }
      if (error.name === "NotAllowedError") {
        return {
          success: false,
          error: "Passkey registration was cancelled or timed out.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to register passkey" };
  }
}

/**
 * Start passkey authentication flow
 */
export async function authenticatePasskey(
  options: PublicKeyCredentialRequestOptionsJSON
) {
  try {
    const credential = await startAuthentication({ optionsJSON: options });
    return { success: true, credential };
  } catch (error) {
    console.error("Passkey authentication failed:", error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.name === "NotAllowedError") {
        return {
          success: false,
          error: "Authentication was cancelled or timed out.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to authenticate with passkey" };
  }
}

/**
 * Check if WebAuthn is supported in this browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === "function"
  );
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
