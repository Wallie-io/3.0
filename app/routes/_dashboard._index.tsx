import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/_dashboard._index";
import { getUserId } from "~/lib/session.server";
import { getAllPosts } from "~/lib/db.client";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef } from "react";

/**
 * Server Loader: Get user ID from session
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  return { userId };
}

/**
 * Client Loader: Fetch posts from local database
 * Receives server loader data and merges it
 */
export async function clientLoader({ serverLoader }: any) {
  // Get server data (userId)
  const serverData = await serverLoader();

  const posts = await getAllPosts();

  // Format timestamps
  const formattedPosts = posts.map((post: any) => ({
    id: post.id,
    author: post.author_name,
    content: post.content,
    timestamp: formatTimestamp(post.created_at),
    authorId: post.author_id,
  }));

  // Merge server and client data
  return {
    userId: serverData.userId,
    posts: formattedPosts
  };
}

// Hydrate client loader with server data
clientLoader.hydrate = true;

// Enable relative time plugin
dayjs.extend(relativeTime);

/**
 * Format timestamp to human-readable string using day.js
 */
function formatTimestamp(timestamp: string): string {
  return dayjs(timestamp).fromNow();
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Wallie" },
    { name: "description", content: "Your local-first social feed" },
  ];
}

export default function DashboardHome() {
  const { userId, posts } = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher<{ success?: boolean; message?: string; error?: string }>();
  const formRef = useRef<HTMLFormElement>(null);

  // Check if we're submitting the form
  const isSubmitting = fetcher.state === "submitting";

  // Clear form after successful submission
  useEffect(() => {
    if (fetcher.data?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [fetcher.data?.success]);

  // Handle CMD+Enter or CTRL+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (formRef.current && !isSubmitting) {
        fetcher.submit(formRef.current);
      }
    }
  };

  // Determine if we have featured content (for demo: feature first 2 posts)
  const featuredPosts = posts.slice(0, 2);
  const regularPosts = posts.slice(2);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6 auto-rows-auto">

        {/* Create Post Card - 2x1 span on desktop, full-width on mobile */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6 h-full">
            <h2 className="text-[20px] font-semibold text-wallie-text-primary mb-4">
              What's on your mind?
            </h2>

            <fetcher.Form ref={formRef} method="post" action="/api/post" className="space-y-4">
              <input type="hidden" name="userId" value={userId || ""} />

              {/* Success message */}
              {fetcher.data?.success && (
                <div className="p-3 rounded-lg bg-wallie-success/10 border border-wallie-success/20 text-wallie-success text-sm">
                  {fetcher.data.message}
                </div>
              )}

              {/* Error message */}
              {fetcher.data?.error && (
                <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
                  {fetcher.data.error}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  name="content"
                  rows={3}
                  placeholder="Share your thoughts..."
                  disabled={isSubmitting}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg",
                    "bg-wallie-slate text-wallie-text-primary",
                    "border border-wallie-charcoal",
                    "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                    "placeholder:text-wallie-text-muted resize-none",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                />
                <p className="text-xs text-wallie-text-tertiary">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-wallie-text-primary bg-wallie-charcoal border border-wallie-text-muted rounded">
                    {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
                  </kbd>{" "}
                  +{" "}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-wallie-text-primary bg-wallie-charcoal border border-wallie-text-muted rounded">
                    Enter
                  </kbd>{" "}
                  to post
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold",
                  "bg-wallie-accent text-wallie-dark",
                  "shadow-wallie-glow-accent",
                  "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                  "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
                  "transition-all duration-200",
                  "active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </fetcher.Form>
          </div>
        </div>

        {/* Trending Widget - 1x2 span on desktop */}
        <aside className="col-span-12 lg:col-span-4 lg:row-span-2">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6 h-full">
            <h3 className="text-[18px] font-semibold text-wallie-text-primary mb-4">
              Trending Topics
            </h3>
            <div className="space-y-3">
              {["#LocalFirst", "#WebAssembly", "#P2P", "#Privacy"].map((tag) => (
                <div
                  key={tag}
                  className="p-3 rounded-lg bg-wallie-slate/50 hover:bg-wallie-charcoal/50 transition-colors cursor-pointer group"
                >
                  <p className="font-medium text-wallie-accent group-hover:text-wallie-accent-dim transition-colors">
                    {tag}
                  </p>
                  <p className="text-xs text-wallie-text-tertiary mt-1">
                    {Math.floor(Math.random() * 100) + 10} posts
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Feed Section */}
        {posts.length === 0 ? (
          <div className="col-span-12">
            <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wallie-accent to-wallie-purple flex items-center justify-center shadow-wallie-glow-accent">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h3 className="text-[24px] font-bold text-wallie-text-primary">
                    Your feed is empty
                  </h3>
                  <p className="text-wallie-text-secondary leading-relaxed">
                    Start sharing your thoughts with the world! Create your first post above to get started.
                  </p>
                </div>

                {/* Decorative element */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="w-2 h-2 rounded-full bg-wallie-accent animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-wallie-purple animate-pulse" style={{ animationDelay: "75ms" }} />
                  <div className="w-2 h-2 rounded-full bg-wallie-pink animate-pulse" style={{ animationDelay: "150ms" }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Posts - Larger cards */}
            {featuredPosts.map((post, index) => (
              <article
                key={post.id}
                className={cn(
                  "col-span-12 md:col-span-6 lg:col-span-4",
                  index === 0 && "lg:col-span-5 lg:row-span-2" // First post is larger
                )}
              >
                <div className={cn(
                  "bg-wallie-darker rounded-2xl shadow-wallie-md p-6 h-full",
                  "border border-transparent hover:border-wallie-accent/20",
                  "hover:shadow-wallie-lg transition-all duration-300",
                  "hover:-translate-y-1"
                )}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold shadow-wallie-glow-accent">
                      {post.author[0]}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-wallie-text-primary">{post.author}</h3>
                        <span className="text-sm text-wallie-text-tertiary">•</span>
                        <span className="text-sm text-wallie-text-tertiary">{post.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <p className={cn(
                    "text-wallie-text-secondary leading-relaxed",
                    index === 0 && "text-lg" // Larger text for featured post
                  )}>
                    {post.content}
                  </p>

                  {/* Post actions */}
                  <div className="flex items-center gap-6 mt-6 text-sm text-wallie-text-tertiary">
                    <button className="flex items-center gap-2 hover:text-wallie-accent transition-colors">
                      <span>♥</span>
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-wallie-purple transition-colors">
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-wallie-success transition-colors">
                      <span>⤴</span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* Suggested Users Widget - Only show if we have posts */}
            {posts.length > 0 && (
              <aside className="col-span-12 md:col-span-6 lg:col-span-3">
                <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 h-full">
                  <h3 className="text-[16px] font-semibold text-wallie-text-primary mb-4">
                    Suggested for You
                  </h3>
                  <div className="space-y-3">
                    {["Alice", "Bob", "Charlie"].map((name) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-wallie-purple/20 flex items-center justify-center text-wallie-purple font-semibold">
                          {name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-wallie-text-primary text-sm">{name}</p>
                          <p className="text-xs text-wallie-text-tertiary">@{name.toLowerCase()}</p>
                        </div>
                        <button className="px-3 py-1 text-xs font-medium bg-wallie-accent/10 text-wallie-accent rounded-lg hover:bg-wallie-accent/20 transition-colors">
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* Regular Posts - 1x1 spans */}
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="col-span-12 md:col-span-6 lg:col-span-4"
              >
                <div className={cn(
                  "bg-wallie-darker rounded-2xl shadow-wallie-md p-6 h-full",
                  "border border-transparent hover:border-wallie-accent/20",
                  "hover:shadow-wallie-lg transition-all duration-300",
                  "hover:-translate-y-1"
                )}>
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold text-sm">
                      {post.author[0]}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-wallie-text-primary text-sm">{post.author}</h3>
                        <span className="text-xs text-wallie-text-tertiary">•</span>
                        <span className="text-xs text-wallie-text-tertiary">{post.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-wallie-text-secondary leading-relaxed">
                    {post.content}
                  </p>

                  {/* Post actions */}
                  <div className="flex items-center gap-6 mt-4 text-xs text-wallie-text-tertiary">
                    <button className="hover:text-wallie-accent transition-colors">♥ Like</button>
                    <button className="hover:text-wallie-purple transition-colors">💬 Comment</button>
                    <button className="hover:text-wallie-success transition-colors">⤴ Share</button>
                  </div>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
