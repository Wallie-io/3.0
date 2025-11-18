import { Link, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/_index";
import { data } from "react-router";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { getUserId } from "~/lib/session.server";
import { getAllPostsForPublicFeed } from "~/db/services/posts";
import { usePostPolling } from "~/hooks/use-post-polling";
import { PostCard } from "~/components/PostCard";
import { LoginRequiredModal } from "~/components/LoginRequiredModal";

/**
 * Landing Page / Public Feed Loader
 * Shows live feed of all posts (including replies)
 * Accessible by both logged-in and anonymous users
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // If logged in, redirect to dashboard version of feed
  if (userId) {
    return redirect("/home");
  }

  // Fetch all posts for public feed
  const posts = await getAllPostsForPublicFeed();

  return data({ posts, userId });
}

export function meta() {
  return [
    { title: "Wallie - The Transparent Social Network" },
    {
      name: "description",
      content: "Join the conversation on Wallie, the transparent social network. Open source, custom algorithms, and creator-first revenue."
    },
  ];
}

export default function PublicFeedPage() {
  const { posts, userId } = useLoaderData<typeof loader>();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Real-time post updates using long polling
  usePostPolling({
    enabled: true,
    onError: (error) => {
      console.error("Post polling error:", error);
    },
  });

  return (
    <div className="min-h-screen bg-wallie-dark text-wallie-text-primary">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-wallie-dark/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-wallie-accent font-display">
              Wallie
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/about"
              className="text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
            >
              About
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className={cn(
                "px-6 py-2 rounded-lg font-semibold",
                "bg-wallie-pink text-white",
                "shadow-lg shadow-wallie-pink/30",
                "hover:shadow-xl hover:shadow-wallie-pink/40",
                "transition-all duration-200"
              )}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Create Post Button - Matches dashboard style */}
          <div className="mb-6">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6 transition-all hover:border-wallie-accent/30 hover:shadow-wallie-xl text-left"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-gray-300 font-bold">
                  ?
                </div>
                <div className="flex-1">
                  <p className="text-lg text-wallie-text-tertiary">What's on your mind?</p>
                </div>
                <div className={cn(
                  "px-6 py-3 rounded-lg font-semibold",
                  "bg-wallie-accent text-wallie-dark",
                  "shadow-wallie-glow-accent",
                  "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                  "transition-all duration-200",
                  "active:scale-[0.98]"
                )}>
                  Create Post
                </div>
              </div>
            </button>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-wallie-text-secondary">
                <p className="text-lg">No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  userId={userId}
                  featured={false}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
