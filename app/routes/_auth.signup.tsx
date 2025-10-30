import { Link, redirect } from "react-router";
import type { Route } from "./+types/_auth.signup";
import { getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { registerPasskey, isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "~/lib/webauthn.client";

/**
 * Loader to check if user is already logged in
 */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId");

  // If already logged in, redirect to dashboard
  if (userId) {
    return redirect("/");
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - Wallie" },
    { name: "description", content: "Create your Wallie account" },
  ];
}

export default function Signup() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    setIsSupported(isWebAuthnSupported());

    // Check platform authenticator availability
    isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Get registration options from server
      const optionsResponse = await fetch("/api/auth/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username }),
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to start registration");
      }

      const { options } = await optionsResponse.json();

      // Step 2: Create passkey with browser
      const result = await registerPasskey(options);

      if (!result.success || !result.credential) {
        setError(result.error || "Failed to create passkey");
        setIsLoading(false);
        return;
      }

      // Step 3: Verify and complete registration
      const verifyResponse = await fetch("/api/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: result.credential }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || "Failed to verify passkey");
      }

      // Redirect will happen automatically via createUserSession
      window.location.href = "/";
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium mb-2">Passkeys Not Supported</p>
          <p className="text-sm">
            Your browser doesn't support passkeys. Please use a modern browser like Chrome, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
      <p className="text-gray-600 mb-6">Sign up with a passkey - no password needed!</p>

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Platform authenticator info */}
        {hasPlatformAuth && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <span className="font-medium">🔐 Passkey Ready!</span> Your device supports Face ID, Touch ID, or Windows Hello.
          </div>
        )}

        {/* Username field (optional) */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={cn(
              "w-full px-4 py-2 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400"
            )}
            placeholder="Leave blank for auto-generated ID"
          />
          <p className="mt-1 text-xs text-gray-500">
            A unique ID will be generated if you don't provide a username
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium",
            "bg-wallie-accent text-white",
            "hover:bg-wallie-accent-dim",
            "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? "Creating Passkey..." : "Create Account with Passkey"}
        </button>
      </form>

      {/* Passkey info */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-700 font-medium mb-2">What's a passkey?</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Passkeys are a more secure and convenient way to sign in. They use your device's biometric authentication (Face ID, Touch ID, or Windows Hello) instead of passwords.
        </p>
      </div>

      {/* Sign in link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-wallie-accent hover:text-wallie-accent-dim">
          Sign in
        </Link>
      </div>
    </div>
  );
}
