import { Link, useSearchParams, redirect } from "react-router";
import type { Route } from "./+types/_auth.login";
import { getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import { useState, useEffect, useRef } from "react";
import { authenticatePasskey, isPlatformAuthenticatorAvailable } from "~/lib/webauthn.client";
import { Html5Qrcode } from "html5-qrcode";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

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
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Desktop QR code display states
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<number | null>(null);
  const qrCodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check platform authenticator availability
    isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);

    // Check for QR token in URL and auto-login
    const qrToken = searchParams.get("qr");
    if (qrToken) {
      loginWithToken(qrToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startQRScanner = async () => {
    console.log("startQRScanner called");
    setShowQRScanner(true);
    setIsScanning(true);
    setError("");

    // Use setTimeout to ensure UI updates before camera access
    setTimeout(async () => {
      try {
        console.log("Checking camera support...");

        // First, check if camera is available and request permission
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access is not supported in this browser");
        }

        console.log("Requesting camera permission...");

        // Request camera permission explicitly - iOS Safari prefers this approach
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        console.log("Camera permission granted, stopping test stream...");

        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());

        console.log("Initializing QR scanner...");

        // Now initialize the QR scanner
        const html5QrCode = new Html5Qrcode("qr-reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            console.log("QR code scanned:", decodedText);
            // QR code scanned successfully
            await stopQRScanner();
            await loginWithToken(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors (happens continuously while scanning)
          }
        );

        console.log("QR scanner started successfully");
      } catch (err) {
        console.error("Failed to start QR scanner:", err);
        console.error("Error details:", {
          name: err instanceof Error ? err.name : "unknown",
          message: err instanceof Error ? err.message : String(err)
        });

        let errorMsg = "Failed to access camera. ";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            errorMsg += "Camera permission was denied. Please allow camera access in your browser settings.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorMsg += "No camera found on this device.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            errorMsg += "Camera is already in use by another application.";
          } else if (err.name === "NotSupportedError" || err.name === "TypeError") {
            errorMsg += "This browser or device doesn't support camera access. Try Safari or Chrome.";
          } else {
            errorMsg += err.message || "Please check camera permissions.";
          }
        } else {
          errorMsg += "Please check camera permissions.";
        }

        setError(errorMsg);
        setIsScanning(false);
        setShowQRScanner(false);
      }
    }, 100);
  };

  const stopQRScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop QR scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const cancelQRScanner = async () => {
    await stopQRScanner();
    setShowQRScanner(false);
  };

  const loginWithToken = async (token: string) => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("token", token);

      const response = await fetch("/api/auth/qr-login", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to log in with QR code");
      }

      // Redirect will happen automatically via createUserSession
      window.location.href = redirectTo;
    } catch (err) {
      console.error("QR login error:", err);
      setError(err instanceof Error ? err.message : "Failed to log in with QR code");
      setIsLoading(false);
      setShowQRScanner(false);
    }
  };

  // Desktop QR Code functions
  const showDesktopQRCode = () => {
    // Generate a unique session ID
    const sessionId = nanoid(32);
    setQrSessionId(sessionId);
    setShowQRCode(true);
    setError("");

    // Set expiry (5 minutes from now)
    setQrExpiry(Date.now() + 5 * 60 * 1000);

    // Start polling for approval
    startPolling(sessionId);
  };

  const startPolling = (sessionId: string) => {
    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/qr-poll?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.status === "approved" && data.token) {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Login with the approved token
          await loginWithToken(data.token);
        } else if (data.status === "expired") {
          // Stop polling and show error
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError("QR code expired. Please generate a new one.");
          setShowQRCode(false);
          setQrSessionId(null);
          setQrExpiry(null);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const cancelDesktopQRCode = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setShowQRCode(false);
    setQrSessionId(null);
    setQrExpiry(null);
  };

  // Render desktop QR code when sessionId changes
  useEffect(() => {
    if (qrSessionId && qrCodeCanvasRef.current) {
      // Create a URL that the mobile app will use to approve
      const approvalUrl = `${window.location.origin}/qr-approve?sessionId=${qrSessionId}`;

      QRCode.toCanvas(qrCodeCanvasRef.current, approvalUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#00e5ff",
          light: "#0f0f0f",
        },
      }).catch((error) => {
        console.error("Failed to render QR code:", error);
        setError("Failed to render QR code. Please try again.");
        cancelDesktopQRCode();
      });
    }
  }, [qrSessionId]);

  // Update countdown timer for desktop QR
  useEffect(() => {
    if (!qrExpiry) return;

    const interval = setInterval(() => {
      const remaining = qrExpiry - Date.now();
      if (remaining <= 0) {
        cancelDesktopQRCode();
        setError("QR code expired. Please try again.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrExpiry]);

  const formatTimeRemaining = () => {
    if (!qrExpiry) return "0:00";
    const remaining = Math.max(0, qrExpiry - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Cleanup scanner and polling on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(console.error);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-[24px] font-bold text-wallie-text-primary mb-2">Sign In</h2>
      <p className="text-wallie-text-secondary mb-6">Use your passkey to sign in securely</p>

      {showQRCode ? (
        /* Desktop QR Code Display */
        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
              {error}
            </div>
          )}

          {/* QR Code Display */}
          <div className="bg-wallie-slate/50 rounded-lg border border-wallie-charcoal p-6">
            <p className="text-sm text-wallie-text-primary font-medium mb-4 text-center">
              Scan this code with your phone to sign in
            </p>
            <div className="flex justify-center">
              <canvas
                ref={qrCodeCanvasRef}
                className="rounded-lg"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-wallie-text-tertiary">
                Expires in: <span className="text-wallie-accent font-mono">{formatTimeRemaining()}</span>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-wallie-charcoal/30 rounded-lg border border-wallie-charcoal/50">
            <p className="text-sm text-wallie-text-secondary">
              📱 Open the Wallie app on your phone (where you're already logged in), scan this QR code, and approve the login to instantly sign in on this device.
            </p>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={cancelDesktopQRCode}
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-semibold",
              "bg-wallie-slate text-wallie-text-primary",
              "border border-wallie-charcoal",
              "hover:bg-wallie-charcoal/50",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancel
          </button>
        </div>
      ) : !showQRScanner ? (
        <>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
                {error}
              </div>
            )}

            {/* Platform authenticator info */}
            {hasPlatformAuth && (
              <div className="p-3 rounded-lg bg-wallie-accent/10 border border-wallie-accent/20 text-wallie-accent text-sm">
                <span className="font-medium">🔐 Ready!</span> Use your Face ID, Touch ID, or Windows Hello to sign in.
              </div>
            )}

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
              {isLoading ? "Authenticating..." : "Sign In with Passkey"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-wallie-charcoal"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-wallie-darker px-2 text-wallie-text-tertiary">Or</span>
            </div>
          </div>

          {/* QR Code Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mobile: Scan QR Code */}
            <button
              type="button"
              onClick={startQRScanner}
              disabled={isLoading}
              className={cn(
                "py-3 px-4 rounded-lg font-semibold text-sm",
                "bg-wallie-slate text-wallie-text-primary",
                "border border-wallie-charcoal",
                "hover:bg-wallie-charcoal/50 hover:border-wallie-accent/30",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:ring-offset-2 focus:ring-offset-wallie-darker",
                "transition-all duration-200",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Scan QR
            </button>

            {/* Desktop: Show QR Code */}
            <button
              type="button"
              onClick={showDesktopQRCode}
              disabled={isLoading}
              className={cn(
                "py-3 px-4 rounded-lg font-semibold text-sm",
                "bg-wallie-slate text-wallie-text-primary",
                "border border-wallie-charcoal",
                "hover:bg-wallie-charcoal/50 hover:border-wallie-accent/30",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:ring-offset-2 focus:ring-offset-wallie-darker",
                "transition-all duration-200",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Show QR
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
              {error}
            </div>
          )}

          {/* QR Scanner */}
          <div className="bg-wallie-slate/50 rounded-lg border border-wallie-charcoal p-4">
            <p className="text-sm text-wallie-text-primary font-medium mb-4 text-center">
              Position the QR code within the frame
            </p>
            <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={cancelQRScanner}
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-semibold",
              "bg-wallie-slate text-wallie-text-primary",
              "border border-wallie-charcoal",
              "hover:bg-wallie-charcoal/50",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Passkey info */}
      <div className="mt-6 p-4 rounded-lg bg-wallie-slate/50 border border-wallie-charcoal/50">
        <p className="text-sm text-wallie-text-primary font-medium mb-2">Using passkeys?</p>
        <p className="text-xs text-wallie-text-secondary leading-relaxed">
          Simply click the button above and use your device's biometric authentication to sign in. No password needed!
        </p>
      </div>

      {/* Sign up link */}
      <div className="mt-6 text-center text-sm text-wallie-text-secondary">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-wallie-accent hover:text-wallie-accent-dim transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}
