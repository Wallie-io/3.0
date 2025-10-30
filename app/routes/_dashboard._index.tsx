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
 */
export async function clientLoader() {
  const posts = await getAllPosts();

  // Format timestamps
  const formattedPosts = posts.map((post: any) => ({
    id: post.id,
    author: post.author_name,
    content: post.content,
    timestamp: formatTimestamp(post.created_at),
    authorId: post.author_id,
  }));

  return { posts: formattedPosts };
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
  const { userId } = useLoaderData<typeof loader>();
  const { posts } = useLoaderData<typeof clientLoader>();
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create post form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a post</h2>

        <fetcher.Form ref={formRef} method="post" action="/api/post" className="space-y-4">
          <input type="hidden" name="userId" value={userId || ""} />

          {/* Success message */}
          {fetcher.data?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {fetcher.data.message}
            </div>
          )}

          {/* Error message */}
          {fetcher.data?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {fetcher.data.error}
            </div>
          )}

          <div className="space-y-2">
            <textarea
              name="content"
              rows={3}
              placeholder="What's on your mind?"
              disabled={isSubmitting}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
                "placeholder:text-gray-400 resize-none",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <p className="text-xs text-gray-500">
              Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Enter
              </kbd>{" "}
              to post
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "px-6 py-2 rounded-lg font-medium",
              "bg-wallie-accent text-white",
              "hover:bg-wallie-accent-dim",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
              "transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </fetcher.Form>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Feed</h2>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wallie-accent to-wallie-purple flex items-center justify-center">
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
                <h3 className="text-xl font-semibold text-gray-900">
                  Your feed is empty
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Start sharing your thoughts with the world! Create your first post above to get started.
                </p>
              </div>

              {/* Decorative element */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="w-2 h-2 rounded-full bg-wallie-accent animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-wallie-purple animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-wallie-pink animate-pulse delay-150" />
              </div>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-white font-bold">
                  {post.author[0]}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{post.author}</h3>
                    <span className="text-sm text-gray-500">• {post.timestamp}</span>
                  </div>

                  <p className="text-gray-700">{post.content}</p>

                  {/* Post actions */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <button className="hover:text-wallie-primary transition-colors">
                      👍 Like
                    </button>
                    <button className="hover:text-wallie-primary transition-colors">
                      💬 Comment
                    </button>
                    <button className="hover:text-wallie-primary transition-colors">
                      🔄 Share
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
