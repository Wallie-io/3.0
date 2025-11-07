import { useLoaderData, useFetcher, data } from "react-router";
import type { Route } from "./+types/_dashboard.settings";
import { requireUserId } from "~/lib/session.server";
import { getUserById, updateUserTheme } from "~/db/services/users";
import { getOrCreateInviteCode, getReferredUsers, getReferralCount } from "~/db/services/invites";
import { cn } from "~/lib/utils";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Copy, CheckCircle, Users, Calendar } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Server Loader: Get user data and invite code
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Get invite code data
  const inviteCodeData = await getOrCreateInviteCode(userId);
  const referredUsers = await getReferredUsers(userId);
  const referralCount = await getReferralCount(userId);

  return data({
    userId: user.id,
    theme: user.theme || "system",
    inviteCode: inviteCodeData,
    referredUsers,
    referralCount,
  });
}

/**
 * Server Action: Update theme preference
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const theme = formData.get("theme") as "light" | "dark" | "system";
  const userId = await requireUserId(request);

  if (!theme) {
    return data({ success: false, error: "Missing theme" }, { status: 400 });
  }

  try {
    await updateUserTheme(userId, theme);
    return data({ success: true, theme });
  } catch (error) {
    console.error("Failed to update theme:", error);
    return data({ success: false, error: "Failed to update theme" }, { status: 500 });
  }
}

/**
 * Settings page with theme toggle and referral dashboard
 */
export default function Settings() {
  const { theme: initialTheme, userId, inviteCode, referredUsers, referralCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [theme, setTheme] = useState(initialTheme || "system");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<number | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle theme changes from form submission
  useEffect(() => {
    setTheme(initialTheme || "system");

    // Dispatch custom event to update theme immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: initialTheme } }));
    }
  }, [initialTheme]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    // Dispatch event immediately for instant UI update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme } }));
    }

    // Submit using fetcher
    const formData = new FormData();
    formData.append("theme", newTheme);

    fetcher.submit(formData, { method: "post" });
  };

  const copyInviteLink = async () => {
    if (!inviteCode?.code) return;

    const inviteLink = `${window.location.origin}/invite/${inviteCode.code}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy invite link");
    }
  };

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      // Get token from server
      const response = await fetch("/api/auth/qr-token", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate token");
      }

      const { token } = await response.json();
      setQrToken(token);

      // Set expiry (5 minutes from now)
      setQrExpiry(Date.now() + 5 * 60 * 1000);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
      setQrToken(null);
      setQrExpiry(null);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Render QR code when token changes
  useEffect(() => {
    if (qrToken && qrCanvasRef.current) {
      // Create a URL that includes the token
      const loginUrl = `${window.location.origin}/login?qr=${qrToken}`;

      QRCode.toCanvas(qrCanvasRef.current, loginUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#00e5ff",
          light: "#0f0f0f",
        },
      }).catch((error) => {
        console.error("Failed to render QR code:", error);
        alert("Failed to render QR code. Please try again.");
        setQrToken(null);
        setQrExpiry(null);
      });
    }
  }, [qrToken]);

  // Update countdown timer
  useEffect(() => {
    if (!qrExpiry) return;

    const interval = setInterval(() => {
      const remaining = qrExpiry - Date.now();
      if (remaining <= 0) {
        setQrToken(null);
        setQrExpiry(null);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-wallie-text-primary mb-2">Settings</h1>
        <p className="text-wallie-text-secondary">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Theme Section */}
      <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-wallie-text-primary mb-4">
          Appearance
        </h2>

        <p className="text-sm text-wallie-text-secondary mb-4">
          Choose how Wallie looks to you. Select a theme or sync with your system settings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={cn(
              "relative p-6 rounded-lg border-2 transition-all duration-200",
              "flex flex-col items-center gap-3",
              "hover:border-wallie-accent/50",
              theme === "light"
                ? "border-wallie-accent bg-wallie-accent/10"
                : "border-wallie-charcoal bg-wallie-slate/50"
            )}
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-white to-gray-100 shadow-lg flex items-center justify-center">
              <span className="text-3xl">☀️</span>
            </div>
            <div className="text-center">
              <div className="font-medium text-wallie-text-primary">Light</div>
              <div className="text-xs text-wallie-text-tertiary mt-1">
                Bright and clean
              </div>
            </div>
            {theme === "light" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-wallie-accent flex items-center justify-center">
                <span className="text-wallie-dark text-xs">✓</span>
              </div>
            )}
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={cn(
              "relative p-6 rounded-lg border-2 transition-all duration-200",
              "flex flex-col items-center gap-3",
              "hover:border-wallie-accent/50",
              theme === "dark"
                ? "border-wallie-accent bg-wallie-accent/10"
                : "border-wallie-charcoal bg-wallie-slate/50"
            )}
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg flex items-center justify-center">
              <span className="text-3xl">🌙</span>
            </div>
            <div className="text-center">
              <div className="font-medium text-wallie-text-primary">Dark</div>
              <div className="text-xs text-wallie-text-tertiary mt-1">
                Easy on the eyes
              </div>
            </div>
            {theme === "dark" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-wallie-accent flex items-center justify-center">
                <span className="text-wallie-dark text-xs">✓</span>
              </div>
            )}
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={cn(
              "relative p-6 rounded-lg border-2 transition-all duration-200",
              "flex flex-col items-center gap-3",
              "hover:border-wallie-accent/50",
              theme === "system"
                ? "border-wallie-accent bg-wallie-accent/10"
                : "border-wallie-charcoal bg-wallie-slate/50"
            )}
          >
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg flex items-center justify-center">
              <span className="text-3xl">💻</span>
            </div>
            <div className="text-center">
              <div className="font-medium text-wallie-text-primary">System</div>
              <div className="text-xs text-wallie-text-tertiary mt-1">
                Match your device
              </div>
            </div>
            {theme === "system" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-wallie-accent flex items-center justify-center">
                <span className="text-wallie-dark text-xs">✓</span>
              </div>
            )}
          </button>
        </div>

        {theme === "system" && (
          <div className="mt-4 p-4 bg-wallie-charcoal/30 rounded-lg border border-wallie-charcoal/50">
            <p className="text-sm text-wallie-text-secondary">
              💡 System mode will automatically switch between light and dark themes based on your device settings.
            </p>
          </div>
        )}
      </div>

      {/* Account Section */}
      <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-wallie-text-primary mb-4">
          Account
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-wallie-text-secondary mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId || "Not logged in"}
              disabled
              className="w-full px-4 py-2 rounded-lg bg-wallie-slate border border-wallie-charcoal text-wallie-text-primary disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Referral Section */}
      {inviteCode && (
        <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-wallie-text-primary mb-4">
            Invite Friends
          </h2>

          <p className="text-sm text-wallie-text-secondary mb-6">
            Share Wallie with your friends! You can generate one invite code per week. When someone signs up with your code, they'll automatically follow you.
          </p>

          {/* Invite Code Display */}
          <div className="space-y-4">
            <div className="p-4 bg-wallie-slate/50 rounded-lg border border-wallie-charcoal">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-wallie-text-secondary">Your Invite Code</span>
                <div className="flex items-center gap-2">
                  {inviteCode.isUsed && (
                    <span className="text-xs px-2 py-1 bg-wallie-accent/20 text-wallie-accent rounded">
                      Used
                    </span>
                  )}
                  {inviteCode.isExpired && !inviteCode.isUsed && (
                    <span className="text-xs px-2 py-1 bg-wallie-error/20 text-wallie-error rounded">
                      Expired
                    </span>
                  )}
                  {!inviteCode.isUsed && !inviteCode.isExpired && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-bold text-wallie-accent font-mono tracking-wider">
                  {inviteCode.code}
                </code>

                <button
                  onClick={copyInviteLink}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                    copied
                      ? "bg-green-500/20 text-green-500"
                      : "bg-wallie-accent/20 text-wallie-accent hover:bg-wallie-accent/30"
                  )}
                >
                  {copied ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-wallie-charcoal/50 flex items-center justify-between text-xs text-wallie-text-tertiary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Expires: {inviteCode.expiresAt ? dayjs(inviteCode.expiresAt).format("MMM D, h:mm A") : "N/A"}
                  </span>
                </div>
                {inviteCode.canGenerateNew && (
                  <span className="text-wallie-accent">
                    New code available
                  </span>
                )}
                {!inviteCode.canGenerateNew && inviteCode.nextAvailableAt && (
                  <span>
                    Next code: {dayjs(inviteCode.nextAvailableAt).format("MMM D")}
                  </span>
                )}
              </div>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-wallie-slate/30 rounded-lg border border-wallie-charcoal/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-wallie-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-wallie-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-wallie-text-primary">
                      {referralCount}
                    </div>
                    <div className="text-xs text-wallie-text-secondary">
                      Total Referrals
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-wallie-slate/30 rounded-lg border border-wallie-charcoal/50">
                <div className="text-sm font-medium text-wallie-text-secondary mb-1">
                  Invite Link
                </div>
                <div className="text-xs text-wallie-text-tertiary font-mono break-all">
                  {`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode.code}`}
                </div>
              </div>
            </div>

            {/* Referred Users List */}
            {referredUsers.length > 0 && (
              <div className="p-4 bg-wallie-slate/30 rounded-lg border border-wallie-charcoal/50">
                <h3 className="text-sm font-medium text-wallie-text-primary mb-3">
                  People You've Invited ({referredUsers.length})
                </h3>
                <div className="space-y-2">
                  {referredUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName || user.username || "User"}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-wallie-accent/20 flex items-center justify-center text-sm font-bold text-wallie-accent">
                            {(user.displayName || user.username || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-wallie-text-primary">
                            {user.displayName || user.username || "Unknown"}
                          </div>
                          <div className="text-xs text-wallie-text-tertiary">
                            Joined {user.referredAt ? dayjs(user.referredAt).fromNow() : "recently"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {referredUsers.length > 5 && (
                    <div className="text-xs text-wallie-text-tertiary text-center pt-2">
                      +{referredUsers.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-wallie-charcoal/30 rounded-lg border border-wallie-charcoal/50">
              <p className="text-sm text-wallie-text-secondary">
                💡 Each invite code can be used once and expires after 7 days. You can generate a new code once per week to maintain organic growth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Login Section */}
      <div className="bg-wallie-darker/70 backdrop-blur-xl border border-wallie-charcoal/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-wallie-text-primary mb-4">
          QR Code Login
        </h2>

        <p className="text-sm text-wallie-text-secondary mb-6">
          Generate a temporary QR code to log in on another device. The code expires in 5 minutes.
        </p>

        {!qrToken ? (
          <button
            onClick={generateQRCode}
            disabled={isGeneratingQR}
            className={cn(
              "w-full sm:w-auto px-6 py-3 rounded-lg font-semibold",
              "bg-wallie-accent text-wallie-dark",
              "shadow-wallie-glow-accent",
              "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGeneratingQR ? "Generating..." : "Generate QR Code"}
          </button>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="flex flex-col items-center p-6 bg-wallie-slate/50 rounded-lg border border-wallie-charcoal">
              <canvas
                ref={qrCanvasRef}
                className="rounded-lg"
              />

              <div className="mt-4 text-center">
                <p className="text-sm text-wallie-text-primary font-medium mb-1">
                  Scan this code on your other device
                </p>
                <p className="text-xs text-wallie-text-tertiary">
                  Expires in: <span className="text-wallie-accent font-mono">{formatTimeRemaining()}</span>
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-wallie-charcoal/30 rounded-lg border border-wallie-charcoal/50">
              <p className="text-sm text-wallie-text-secondary">
                📱 Open your phone's camera app and scan this QR code. Your camera will recognize it as a link and you can tap to open and log in instantly!
              </p>
            </div>

            {/* Generate New Button */}
            <button
              onClick={generateQRCode}
              disabled={isGeneratingQR}
              className={cn(
                "w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium",
                "bg-wallie-slate text-wallie-text-primary",
                "border border-wallie-charcoal",
                "hover:bg-wallie-charcoal/50",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Generate New Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Wallie" },
    { name: "description", content: "Manage your Wallie preferences and settings" },
  ];
}
