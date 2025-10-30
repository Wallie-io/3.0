import { Link, useSearchParams, redirect } from "react-router";
import type { Route } from "./+types/_auth.login";
import { getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { authenticatePasskey, isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "~/lib/webauthn.client";

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
    { title: "Login - Wallie" },
    { name: "description", content: "Sign in to your Wallie account" },
  ];
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await fetch("/api/auth/login-options", {
        method: "POST",
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to start login");
      }

      const { options } = await optionsResponse.json();

      // Step 2: Authenticate with passkey
      const result = await authenticatePasskey(options);

      if (!result.success || !result.credential) {
        setError(result.error || "Failed to authenticate with passkey");
        setIsLoading(false);
        return;
      }

      // Step 3: Verify and complete login
      const verifyResponse = await fetch("/api/auth/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: result.credential }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || "Failed to verify passkey");
      }

      // Redirect will happen automatically via createUserSession
      window.location.href = redirectTo;
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
      <p className="text-gray-600 mb-6">Use your passkey to sign in securely</p>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Platform authenticator info */}
        {hasPlatformAuth && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <span className="font-medium">🔐 Ready!</span> Use your Face ID, Touch ID, or Windows Hello to sign in.
          </div>
        )}

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
          {isLoading ? "Authenticating..." : "Sign In with Passkey"}
        </button>
      </form>

      {/* Passkey info */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-700 font-medium mb-2">Using passkeys?</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Simply click the button above and use your device's biometric authentication to sign in. No password needed!
        </p>
      </div>

      {/* Sign up link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-wallie-accent hover:text-wallie-accent-dim">
          Sign up
        </Link>
      </div>
    </div>
  );
}
