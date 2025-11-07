import { Link, redirect, data } from "react-router";
import type { Route } from "./+types/_auth.signup";
import { getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { registerPasskey, isPlatformAuthenticatorAvailable } from "~/lib/webauthn.client";
import { validateInviteCode } from "~/db/services/invites";

/**
 * Loader to check if user is already logged in and handle referral codes
 */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId");

  // If already logged in, redirect to dashboard
  if (userId) {
    return redirect("/");
  }

  // Check for referral code in query params
  const url = new URL(request.url);
  const refCode = url.searchParams.get("ref");

  if (refCode) {
    // Validate the referral code
    const validation = await validateInviteCode(refCode);

    if (validation) {
      return data({
        hasReferral: true,
        referralCode: refCode,
        referrer: validation.referrer,
      });
    }
  }

  return data({
    hasReferral: false,
    referralCode: null,
    referrer: null,
  });
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - Wallie" },
    { name: "description", content: "Create your Wallie account" },
  ];
}

export default function Signup({ loaderData }: Route.ComponentProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);

  useEffect(() => {
    // Check platform authenticator availability
    isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Get registration options from server
      const formData = new URLSearchParams({ username });
      if (loaderData.hasReferral && loaderData.referralCode) {
        formData.append("referralCode", loaderData.referralCode);
      }

      const optionsResponse = await fetch("/api/auth/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
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

  return (
    <div>
      <h2 className="text-[24px] font-bold text-wallie-text-primary mb-2">Create Account</h2>
      <p className="text-wallie-text-secondary mb-6">Sign up with a passkey - no password needed!</p>

      {/* Referrer Info */}
      {loaderData.hasReferral && loaderData.referrer && (
        <div className="mb-6 p-4 rounded-lg bg-wallie-accent/10 border border-wallie-accent/20">
          <div className="flex items-center gap-3">
            {loaderData.referrer.avatarUrl ? (
              <img
                src={loaderData.referrer.avatarUrl}
                alt={loaderData.referrer.displayName || loaderData.referrer.username || "User"}
                className="w-12 h-12 rounded-full border-2 border-wallie-accent"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-wallie-accent/20 border-2 border-wallie-accent flex items-center justify-center text-lg font-bold text-wallie-accent">
                {(loaderData.referrer.displayName || loaderData.referrer.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-xs text-wallie-text-secondary">Invited by</p>
              <p className="text-sm font-bold text-wallie-accent">
                {loaderData.referrer.displayName || loaderData.referrer.username || "A Wallie user"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
            {error}
          </div>
        )}

        {/* Platform authenticator info */}
        {hasPlatformAuth && (
          <div className="p-3 rounded-lg bg-wallie-accent/10 border border-wallie-accent/20 text-wallie-accent text-sm">
            <span className="font-medium">🔐 Passkey Ready!</span> Your device supports Face ID, Touch ID, or Windows Hello.
          </div>
        )}

        {/* Username field (optional) */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-wallie-text-secondary mb-2">
            Username <span className="text-wallie-text-tertiary font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-wallie-slate text-wallie-text-primary",
              "border border-wallie-charcoal",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
              "placeholder:text-wallie-text-muted",
              "transition-all duration-200"
            )}
            placeholder="Leave blank for auto-generated ID"
          />
          <p className="mt-2 text-xs text-wallie-text-tertiary">
            A unique ID will be generated if you don't provide a username
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-semibold",
            "bg-wallie-accent text-wallie-dark",
            "shadow-wallie-glow-accent",
            "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
            "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
            "transition-all duration-200",
            "active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? "Creating Passkey..." : "Create Account with Passkey"}
        </button>
      </form>

      {/* Passkey info */}
      <div className="mt-6 p-4 rounded-lg bg-wallie-slate/50 border border-wallie-charcoal/50">
        <p className="text-sm text-wallie-text-primary font-medium mb-2">What's a passkey?</p>
        <p className="text-xs text-wallie-text-secondary leading-relaxed">
          Passkeys are a more secure and convenient way to sign in. They use your device's biometric authentication (Face ID, Touch ID, or Windows Hello) instead of passwords.
        </p>
      </div>

      {/* Sign in link */}
      <div className="mt-6 text-center text-sm text-wallie-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-wallie-accent hover:text-wallie-accent-dim transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
