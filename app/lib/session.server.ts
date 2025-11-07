import { createCookieSessionStorage, redirect } from "react-router";

// Types for session data
export interface SessionData {
  userId: string;
  email?: string;
  challenge?: string;      // For WebAuthn registration/authentication
  username?: string;       // Temporary storage during registration
  tempUserId?: string;     // Temporary userId during registration (before verification)
  referralCode?: string;   // Referral code during signup
}

export interface SessionFlashData {
  error: string;
}

// Export commit method
export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

// In production, set SESSION_SECRET in your environment variables
// You can generate a secret with: openssl rand -base64 32
const SESSION_SECRET = process.env.SESSION_SECRET || "default-dev-secret-change-in-production";

// Create session storage
export const sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

/**
 * Get the session from the request
 */
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

/**
 * Get the user ID from the session
 * Returns null if no user is logged in
 */
export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  return userId || null;
}

/**
 * Require a user to be logged in
 * Redirects to login page if not authenticated
 */
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

/**
 * Create a new session with user data
 */
export async function createUserSession({
  request,
  userId,
  email,
  redirectTo,
}: {
  request: Request;
  userId: string;
  email?: string;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set("userId", userId);
  if (email) {
    session.set("email", email);
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

/**
 * Destroy the session (logout)
 */
export async function destroySession(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
