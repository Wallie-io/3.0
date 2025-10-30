import { Outlet } from "react-router";

/**
 * Pathless layout for authentication pages
 * This layout wraps all auth-related routes (login, signup, etc.)
 * without adding a path segment to the URL
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8">
        {/* Wallie Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-wallie-accent mb-2">Wallie</h1>
          <p className="text-gray-600">Your local-first social network</p>
        </div>

        {/* Auth form content (login/signup) */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Local-first • End-to-end encrypted • Your data, your control</p>
        </div>
      </div>
    </div>
  );
}
