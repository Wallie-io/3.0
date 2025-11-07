import { useSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/_dashboard.qr-approve";
import { requireUserId } from "~/lib/session.server";
import { data } from "react-router";
import { cn } from "~/lib/utils";
import { useState } from "react";

/**
 * Server Loader: Ensure user is logged in
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Require authentication - only logged-in mobile users can approve
  await requireUserId(request);
  return data({ success: true });
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Approve Login - Wallie" },
    { name: "description", content: "Approve login on another device" },
  ];
}

/**
 * QR Approval Page
 * Mobile users land here after scanning desktop QR code
 */
export default function QRApprove() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApprove = async () => {
    if (!sessionId) {
      setError("Invalid QR code - no session ID found");
      return;
    }

    setIsApproving(true);
    setError("");

    try {
      // Call the API to create a login token for this sessionId
      const formData = new FormData();
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/auth/qr-token", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve login");
      }

      // Success!
      setSuccess(true);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Approval error:", err);
      setError(err instanceof Error ? err.message : "Failed to approve login");
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (!sessionId) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-wallie-text-primary mb-2">
              Invalid QR Code
            </h2>
            <p className="text-wallie-text-secondary mb-6">
              This QR code is missing required information. Please try scanning again.
            </p>
            <button
              onClick={handleCancel}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-semibold",
                "bg-wallie-slate text-wallie-text-primary",
                "border border-wallie-charcoal",
                "hover:bg-wallie-charcoal/50",
                "transition-all duration-200"
              )}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-wallie-text-primary mb-2">
              Login Approved!
            </h2>
            <p className="text-wallie-text-secondary mb-6">
              Your other device has been logged in successfully. You can now close this page.
            </p>
            <div className="flex items-center justify-center gap-2 text-wallie-accent">
              <div className="w-2 h-2 bg-wallie-accent rounded-full animate-pulse"></div>
              <span className="text-sm">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-wallie-text-primary mb-2">
            Approve Login Request
          </h2>
          <p className="text-wallie-text-secondary">
            You're about to log in to Wallie on another device. Only approve this if you initiated the login.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
            {error}
          </div>
        )}

        {/* Session Info */}
        <div className="mb-6 p-4 bg-wallie-slate/50 rounded-lg border border-wallie-charcoal">
          <p className="text-xs text-wallie-text-tertiary mb-1">Session ID</p>
          <p className="text-xs font-mono text-wallie-text-primary break-all">
            {sessionId.substring(0, 16)}...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCancel}
            disabled={isApproving}
            className={cn(
              "py-3 px-4 rounded-lg font-semibold",
              "bg-wallie-slate text-wallie-text-primary",
              "border border-wallie-charcoal",
              "hover:bg-wallie-charcoal/50",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancel
          </button>

          <button
            onClick={handleApprove}
            disabled={isApproving}
            className={cn(
              "py-3 px-4 rounded-lg font-semibold",
              "bg-wallie-accent text-wallie-dark",
              "shadow-wallie-glow-accent",
              "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isApproving ? "Approving..." : "Approve"}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-wallie-charcoal/30 rounded-lg border border-wallie-charcoal/50">
          <p className="text-xs text-wallie-text-secondary">
            🔒 For your security, only approve login requests that you initiated. If you didn't request this login, tap Cancel and change your password.
          </p>
        </div>
      </div>
    </div>
  );
}
