import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/_auth.signup";
import { createUserSession, getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";

/**
 * Action handler for signup form submission
 * In a real app, this would create a user in the database
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validation
  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  if (typeof password !== "string" || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // TODO: Replace with actual user creation logic
  // - Check if user already exists
  // - Hash password
  // - Create user in database
  // - Set up WebAuthn/Passkeys
  // - Create Arweave profile

  // For now, we'll create a session with a mock user ID
  const mockUserId = `user_${Date.now()}`;

  return createUserSession({
    request,
    userId: mockUserId,
    email,
    redirectTo: "/",
  });
}

/**
 * Loader to check if user is already logged in
 */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId");

  // If already logged in, redirect to dashboard
  if (userId) {
    return Response.redirect("/");
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
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

      <Form method="post" className="space-y-4">
        {/* Error message */}
        {actionData?.error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {actionData.error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            className={cn(
              "w-full px-4 py-2 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400"
            )}
            placeholder="you@example.com"
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="new-password"
            className={cn(
              "w-full px-4 py-2 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400"
            )}
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            className={cn(
              "w-full px-4 py-2 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400"
            )}
            placeholder="••••••••"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium",
            "bg-wallie-accent text-white",
            "hover:bg-wallie-accent-dim",
            "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
            "transition-colors duration-200"
          )}
        >
          Create Account
        </button>
      </Form>

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
