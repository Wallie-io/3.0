import { Link, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/_index";
import { data } from "react-router";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { getUserId } from "~/lib/session.server";
import { getTotalUserCount, getOnlineUserCount } from "~/db/services/users";

/**
 * Landing Page Loader
 * Redirects to dashboard if user is already logged in
 * Fetches current stats for the anticipation marketing
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Redirect to dashboard if already logged in
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/home");
  }

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
    { title: "Wallie - The Transparent Social Network" },
    {
      name: "description",
      content: "Join Wallie, the transparent social network. Open source, custom algorithms, and creator-first revenue. Social media built for the community."
    },
  ];
}

export default function LandingPage() {
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
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-wallie-accent to-wallie-purple bg-clip-text text-transparent font-display">
              Wallie
            </div>
          </div>
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
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute top-1/4 -left-1/4 w-96 h-96 bg-wallie-accent/20 rounded-full blur-3xl",
            mounted && "animate-pulse"
          )} />
          <div className={cn(
            "absolute bottom-1/4 -right-1/4 w-96 h-96 bg-wallie-purple/20 rounded-full blur-3xl",
            mounted && "animate-pulse"
          )} style={{ animationDelay: "1s" }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-wallie-pink/15 rounded-full blur-3xl",
            mounted && "animate-pulse"
          )} style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wallie-charcoal/50 backdrop-blur-sm border border-wallie-accent/20 mb-8 mt-4 md:mt-8 lg:mt-12">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wallie-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-wallie-accent"></span>
            </span>
            <span className="text-sm text-wallie-text-secondary">
              Now in Beta • Building the Future
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-wallie-accent to-wallie-purple bg-clip-text text-transparent">
              Your Data.
            </span>
            <br />
            <span className="text-wallie-text-primary">
              Your Network.
            </span>
            <br />
            <span className="bg-gradient-to-r from-wallie-pink to-wallie-purple bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-wallie-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Welcome to <span className="text-wallie-accent font-semibold">Wallie</span>, the transparent social network.
            Open source, custom algorithms, and creator-first revenue. Built for the community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/signup"
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-lg",
                "bg-wallie-pink text-white",
                "shadow-lg shadow-wallie-pink/30",
                "hover:shadow-xl hover:shadow-wallie-pink/40 hover:scale-105",
                "transition-all duration-200"
              )}
            >
              Join the Revolution
            </Link>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                "px-8 py-4 rounded-xl font-semibold text-lg",
                "bg-wallie-charcoal/50 text-wallie-text-primary backdrop-blur-sm",
                "border border-white/10",
                "hover:bg-wallie-charcoal hover:border-white/20",
                "transition-all duration-200"
              )}
            >
              Learn More
            </button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-wallie-charcoal/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-wallie-accent mb-2">
                {totalSignups.toLocaleString()}
              </div>
              <div className="text-sm text-wallie-text-secondary">
                Early Adopters
              </div>
            </div>
            <div className="bg-wallie-charcoal/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-wallie-success mb-2 animate-pulse">
                {onlineUsers.toLocaleString()}
              </div>
              <div className="text-sm text-wallie-text-secondary">
                Users Online Now
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative pt-16 pb-32 px-6 bg-wallie-charcoal/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why <span className="text-wallie-accent">Wallie</span>?
            </h2>
            <p className="text-xl text-wallie-text-secondary max-w-2xl mx-auto">
              Built different. Built for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-accent/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">🔓</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Open Source
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                Fully transparent code. No hidden algorithms. See exactly how Wallie works and contribute to its development.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-purple/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Rich Content
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                Express yourself with markdown, images, and a beautiful interface designed for creators.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-success/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Lightning Fast
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                No loading spinners. No waiting. Everything is instant because your data is already there.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-accent/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Communities
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                Join communities that matter to you. Share ideas, learn, and build together.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-purple/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Private Messaging
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                End-to-end encrypted conversations. Your messages stay between you and your friends.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-wallie-darker rounded-2xl p-8 border border-white/10 hover:border-wallie-success/30 transition-all duration-300 hover:shadow-wallie-lg">
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="text-2xl font-bold mb-3 text-wallie-text-primary">
                Hangouts
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                Voice and video hangouts with your community. Connect in real-time, whenever you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to take back control?
          </h2>
          <p className="text-xl text-wallie-text-secondary mb-10">
            Join the early adopters building the future of social networking.
          </p>
          <Link
            to="/signup"
            className={cn(
              "inline-flex px-10 py-5 rounded-xl font-bold text-xl",
              "bg-wallie-pink text-white",
              "shadow-lg shadow-wallie-pink/30",
              "hover:shadow-xl hover:shadow-wallie-pink/40 hover:scale-105",
              "transition-all duration-200"
            )}
          >
            Get Started Now
          </Link>
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
