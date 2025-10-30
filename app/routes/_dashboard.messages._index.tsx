import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/_dashboard.messages._index";
import { getUserId } from "~/lib/session.server";
import { getThreadsForUser } from "~/lib/db.client";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Enable relative time plugin
dayjs.extend(relativeTime);

/**
 * Server Loader: Get user ID from session
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  return { userId };
}

/**
 * Client Loader: Fetch message threads from local database
 */
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  const { userId } = data as { userId: string | null };

  if (!userId) {
    return { threads: [] };
  }

  // Fetch threads from local database
  const threads = await getThreadsForUser(userId);

  // Format threads for display
  const formattedThreads = threads.map((thread: any) => ({
    id: thread.id,
    recipientName: thread.recipient_name || "Unknown",
    recipientAvatar: thread.recipient_name?.[0]?.toUpperCase() || "?",
    recipientId: thread.recipient_id,
    lastMessage: thread.last_message || "No messages yet",
    lastMessageTime: thread.last_message_time
      ? formatTimestamp(thread.last_message_time)
      : "",
    unread: false, // TODO: Implement unread tracking
  }));

  return { threads: formattedThreads };
}

clientLoader.hydrate = true;

/**
 * Format timestamp to human-readable string using day.js
 */
function formatTimestamp(timestamp: string): string {
  return dayjs(timestamp).fromNow();
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Messages - Wallie" },
    { name: "description", content: "Your end-to-end encrypted conversations" },
  ];
}

export default function MessagesList() {
  const { threads } = useLoaderData<typeof clientLoader>();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-600 mt-1">🔒 All messages are end-to-end encrypted</p>
        </div>

        {/* Threads list */}
        <div className="divide-y divide-gray-200">
          {threads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">Start a new conversation to get started</p>
            </div>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className={cn(
                  "flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors",
                  thread.unread && "bg-blue-50/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {thread.recipientAvatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={cn(
                        "font-semibold",
                        thread.unread ? "text-gray-900" : "text-gray-700"
                      )}
                    >
                      {thread.recipientName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {thread.lastMessageTime}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-sm truncate",
                      thread.unread ? "text-gray-700 font-medium" : "text-gray-500"
                    )}
                  >
                    {thread.lastMessage}
                  </p>
                </div>

                {thread.unread && (
                  <div className="w-2 h-2 rounded-full bg-wallie-accent flex-shrink-0" />
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
