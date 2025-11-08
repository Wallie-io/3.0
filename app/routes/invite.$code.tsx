/**
 * Public landing page for invite codes
 * Route: /invite/:code
 */

import { data, redirect, Link } from "react-router";
import type { Route } from "./+types/invite.$code";
import { validateInviteCode } from "~/db/services/invites";
import { CheckCircle, Users, Code, DollarSign, Eye } from "lucide-react";

export async function loader({ params }: Route.LoaderArgs) {
  const code = params.code;

  if (!code) {
    throw new Response("Invite code is required", { status: 400 });
  }

  // Validate the invite code
  const validation = await validateInviteCode(code);

  if (!validation) {
    return data({
      valid: false,
      code,
      referrer: null,
    });
  }

  return data({
    valid: true,
    code,
    referrer: validation.referrer,
  });
}

export default function InviteLanding({ loaderData }: Route.ComponentProps) {
  const { valid, code, referrer } = loaderData;

  if (!valid) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-wallie-dark">
        <div className="absolute inset-0 bg-gradient-to-br from-wallie-accent/5 via-wallie-purple/5 to-wallie-pink/5" />

        <div className="w-full max-w-2xl p-8 relative z-10 text-center">
          <h1 className="text-[48px] font-bold text-wallie-accent tracking-tight mb-4 font-display">
            Wallie
          </h1>

          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-xl border border-white/10 p-12">
            <div className="text-6xl mb-6">😕</div>
            <h2 className="text-2xl font-bold text-wallie-text mb-4">
              Invalid or Expired Invite Code
            </h2>
            <p className="text-wallie-text-secondary mb-8">
              This invite code is no longer valid. It may have been used or expired.
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 bg-wallie-accent hover:bg-wallie-accent-dim text-wallie-dark font-semibold rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-wallie-dark">
      <div className="absolute inset-0 bg-gradient-to-br from-wallie-accent/5 via-wallie-purple/5 to-wallie-pink/5" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-[64px] font-bold text-wallie-accent tracking-tight mb-4 font-display">
            Wallie
          </h1>
          <p className="text-2xl text-wallie-text-secondary mb-8">
            The Transparent Social Network
          </p>

          {/* Referrer Card */}
          {referrer && (
            <div className="inline-block bg-wallie-darker/70 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-8">
              <div className="flex items-center gap-4">
                {referrer.avatarUrl ? (
                  <img
                    src={referrer.avatarUrl}
                    alt={referrer.displayName || referrer.username || "User"}
                    className="w-16 h-16 rounded-full border-2 border-wallie-accent"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-wallie-accent/20 border-2 border-wallie-accent flex items-center justify-center text-2xl font-bold text-wallie-accent">
                    {(referrer.displayName || referrer.username || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-wallie-text-secondary text-sm">You've been invited by</p>
                  <p className="text-xl font-bold text-wallie-text">
                    {referrer.displayName || referrer.username || "A Wallie user"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Open Source */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-xl border border-white/10 p-8 hover:border-wallie-accent/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-wallie-accent/20 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-wallie-accent" />
            </div>
            <h3 className="text-xl font-bold text-wallie-text mb-3">Open Source</h3>
            <p className="text-wallie-text-secondary">
              Fully transparent code. No hidden algorithms. You can see exactly how Wallie works
              and even contribute to its development.
            </p>
          </div>

          {/* Custom Algorithms */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-xl border border-white/10 p-8 hover:border-wallie-purple/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-wallie-purple/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-wallie-purple" />
            </div>
            <h3 className="text-xl font-bold text-wallie-text mb-3">Custom Algorithms</h3>
            <p className="text-wallie-text-secondary">
              Build your own feed algorithm. You decide what content you see and how it's
              ranked. No corporate manipulation.
            </p>
          </div>

          {/* Creator-First Revenue */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-xl border border-white/10 p-8 hover:border-wallie-pink/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-wallie-pink/20 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-wallie-pink" />
            </div>
            <h3 className="text-xl font-bold text-wallie-text mb-3">Creator-First Revenue</h3>
            <p className="text-wallie-text-secondary">
              Revenue goes to creators and community organizers first. No venture capital
              interests. Built for the community, by the community.
            </p>
          </div>

          {/* Full Transparency */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-xl border border-white/10 p-8 hover:border-wallie-accent/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-wallie-accent/20 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-wallie-accent" />
            </div>
            <h3 className="text-xl font-bold text-wallie-text mb-3">Full Transparency</h3>
            <p className="text-wallie-text-secondary">
              We post all operational costs online. No hidden fees. We're committed to keeping
              costs down while delivering the best social experience.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-wallie-accent/20 via-wallie-purple/20 to-wallie-pink/20 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <h2 className="text-3xl font-bold text-wallie-text mb-4">
            Ready to Join {referrer?.displayName || referrer?.username || "Us"}?
          </h2>
          <p className="text-wallie-text-secondary mb-8 text-lg">
            Accept the invite and be part of a social network that puts people first.
          </p>

          <Link
            to={`/signup?ref=${code}`}
            className="inline-block px-12 py-4 bg-wallie-accent hover:bg-wallie-accent-dim text-wallie-dark font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            Accept Invite & Sign Up
          </Link>

          <p className="text-sm text-wallie-text-tertiary mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-wallie-accent hover:text-wallie-accent-dim underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
