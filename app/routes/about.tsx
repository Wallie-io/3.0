import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/about";
import { data } from "react-router";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { getTotalUserCount, getOnlineUserCount } from "~/db/services/users";

/**
 * About Page Loader
 * Fetches current stats for the marketing page
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Fetch actual stats from database
  const totalSignups = await getTotalUserCount();
  const onlineUsers = await getOnlineUserCount();

  const stats = {
    totalSignups,
    onlineUsers,
  };

  return data(stats);
}

export function meta() {
  return [
    { title: "About Wallie - The Transparent Social Network" },
    {
      name: "description",
      content: "Learn about Wallie, the transparent social network. Open source, custom algorithms, and creator-first revenue. Social media built for the community."
    },
  ];
}

export default function AboutPage() {
  const loaderData = useLoaderData<typeof loader>();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalSignups: loaderData.totalSignups,
    onlineUsers: loaderData.onlineUsers,
  });
  const [pollDelay, setPollDelay] = useState(1500);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll for updated stats with exponential backoff
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();

          // Check if values changed
          const hasChanged =
            data.totalSignups !== stats.totalSignups ||
            data.onlineUsers !== stats.onlineUsers;

          if (hasChanged) {
            setStats({
              totalSignups: data.totalSignups,
              onlineUsers: data.onlineUsers,
            });
            // Reset delay to initial value on change
            setPollDelay(1500);
          } else {
            // Exponential backoff: double the delay, max out at ~30 seconds
            setPollDelay(prev => Math.min(prev * 2, 30000));
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // On error, use exponential backoff as well
        setPollDelay(prev => Math.min(prev * 2, 30000));
      }

      // Schedule next poll
      timeoutId = setTimeout(fetchStats, pollDelay);
    };

    // Start polling after initial delay
    timeoutId = setTimeout(fetchStats, pollDelay);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pollDelay, stats]);

  const { totalSignups, onlineUsers } = stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-wallie-dark via-wallie-charcoal to-wallie-dark text-wallie-text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-wallie-dark/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-wallie-accent font-display">
              Wallie
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={cn(
                "px-6 py-2 rounded-lg font-semibold",
                "bg-wallie-accent text-wallie-dark",
                "shadow-wallie-glow-accent",
                "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                "transition-all duration-200"
              )}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 py-20">
        {/* Simplified background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-wallie-dark via-wallie-charcoal/50 to-wallie-dark" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-4xl">
            {/* Main headline - Cloudflare style */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1]">
              Connect, create, and share{" "}
              <span className="text-wallie-accent">
                transparently
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-wallie-text-secondary mb-12 max-w-2xl leading-relaxed">
              We make social networking open source and transparent. Our platform is the best place to build authentic connections and share content that matters.
            </p>

            {/* CTA Button - Simpler Cloudflare style */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-20">
              <Link
                to="/signup"
                className={cn(
                  "px-8 py-4 rounded-lg font-semibold text-lg",
                  "bg-wallie-pink text-white",
                  "shadow-lg shadow-wallie-pink/30",
                  "hover:shadow-xl hover:shadow-wallie-pink/40",
                  "transition-all duration-200"
                )}
              >
                Start for free
              </Link>
              <Link
                to="/login"
                className={cn(
                  "px-8 py-4 rounded-lg font-semibold text-lg",
                  "text-wallie-text-primary border border-white/20",
                  "hover:bg-wallie-charcoal/50 hover:border-white/30",
                  "transition-all duration-200"
                )}
              >
                Sign in
              </Link>
            </div>

            {/* Live Stats - More subtle */}
            <div className="flex flex-wrap gap-8 text-sm text-wallie-text-secondary">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wallie-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-wallie-success"></span>
                </span>
                <span>
                  <span className="font-semibold text-wallie-text-primary">{onlineUsers.toLocaleString()}</span> online now
                </span>
              </div>
              <div>
                <span className="font-semibold text-wallie-text-primary">{totalSignups.toLocaleString()}</span> early adopters
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="text-4xl mb-6">🔓</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Open Source
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                Fully transparent code. No hidden algorithms. See exactly how Wallie works and contribute to its development.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="text-4xl mb-6">🎨</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Rich Content
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                Express yourself with markdown, images, and a beautiful interface designed for creators.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Lightning Fast
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                No loading spinners. No waiting. Everything is instant because your data is already there.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="text-4xl mb-6">🌐</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Communities
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                Join communities that matter to you. Share ideas, learn, and build together.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group">
              <div className="text-4xl mb-6">💬</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Private Messaging
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                End-to-end encrypted conversations. Your messages stay between you and your friends.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group">
              <div className="text-4xl mb-6">🎙️</div>
              <h3 className="text-2xl font-bold mb-4 text-wallie-text-primary">
                Hangouts
              </h3>
              <p className="text-lg text-wallie-text-secondary leading-relaxed">
                Voice and video hangouts with your community. Connect in real-time, whenever you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ready to join the transparent social network?
            </h2>
            <p className="text-xl text-wallie-text-secondary mb-10 max-w-2xl">
              Start building authentic connections today.
            </p>
            <Link
              to="/signup"
              className={cn(
                "inline-flex px-8 py-4 rounded-lg font-semibold text-lg",
                "bg-wallie-pink text-white",
                "shadow-lg shadow-wallie-pink/30",
                "hover:shadow-xl hover:shadow-wallie-pink/40",
                "transition-all duration-200"
              )}
            >
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-wallie-text-tertiary">
          <p>© 2025 Wallie. Building the future of social networking.</p>
        </div>
      </footer>
    </div>
  );
}
