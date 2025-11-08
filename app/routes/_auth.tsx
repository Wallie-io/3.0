import { Outlet } from "react-router";

/**
 * Pathless layout for authentication pages
 * This layout wraps all auth-related routes (login, signup, etc.)
 * without adding a path segment to the URL
 */
export default function AuthLayout() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-wallie-dark">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-wallie-accent/5 via-wallie-purple/5 to-wallie-pink/5" />

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Wallie Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[48px] font-bold text-wallie-accent tracking-tight mb-2 font-display">Wallie</h1>
          <p className="text-wallie-text-secondary">The Transparent Social Network</p>
        </div>

        {/* Auth form content (login/signup) */}
        <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-xl border border-white/10 p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-wallie-text-tertiary">
          <p>
            <a
              href="https://github.com/your-repo/wallie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wallie-accent hover:text-wallie-accent-dim transition-colors underline"
            >
              Open source
            </a>
            {" "}• Transparent • Built for the community
          </p>
        </div>
      </div>
    </div>
  );
}
