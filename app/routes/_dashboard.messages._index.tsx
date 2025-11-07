import { Link, useLoaderData, Outlet } from "react-router";
import type { Route } from "./+types/_dashboard.messages._index";
import { requireUserId } from "~/lib/session.server";
import { getThreadsForUser } from "~/db/services/messages";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Enable relative time plugin
dayjs.extend(relativeTime);

/**
 * Server Loader: Fetch message threads from database
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  // Get threads from database
  const result = await getThreadsForUser(userId, { limit: 15 });

  // Format threads for display
  const threads = result.data.map((thread) => ({
    id: thread.id,
    recipientName: thread.recipient_name || "Unknown",
    recipientAvatar: thread.recipient_name?.[0]?.toUpperCase() || "?",
    recipientId: thread.recipient_id,
    lastMessage: thread.last_message || "No messages yet",
    lastMessageTime: thread.last_message_time
      ? dayjs(thread.last_message_time).fromNow()
      : "",
    unread: false, // TODO: Implement unread tracking
  }));

  return { threads };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Messages - Wallie" },
    { name: "description", content: "Your end-to-end encrypted conversations" },
  ];
}

export default function MessagesList() {
  const { threads } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-wallie-charcoal/50 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-wallie-text-primary">Messages</h1>
            <p className="text-sm text-wallie-text-secondary mt-1">Your conversations</p>
          </div>
          <Link
            to="/messages/new"
            className={cn(
              "px-4 py-2 rounded-lg font-medium",
              "bg-wallie-accent text-wallie-dark",
              "hover:bg-wallie-accent-dim",
              "transition-colors duration-200"
            )}
          >
            + New Chat
          </Link>
        </div>

        {/* Threads list */}
        <div className="divide-y divide-wallie-charcoal/50">
          {threads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-wallie-text-secondary">No conversations yet</p>
              <p className="text-sm text-wallie-text-tertiary mt-2">Start a new conversation to get started</p>
            </div>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className={cn(
                  "flex items-center gap-4 p-6 hover:bg-wallie-charcoal/30 transition-all duration-200",
                  thread.unread && "bg-wallie-accent/10 border-l-4 border-wallie-accent"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold text-lg flex-shrink-0 shadow-wallie-glow-accent">
                  {thread.recipientAvatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={cn(
                        "font-semibold",
                        thread.unread ? "text-wallie-text-primary" : "text-wallie-text-secondary"
                      )}
                    >
                      {thread.recipientName}
                    </h3>
                    <span className="text-xs text-wallie-text-tertiary flex-shrink-0">
                      {thread.lastMessageTime}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-sm truncate",
                      thread.unread ? "text-wallie-text-secondary font-medium" : "text-wallie-text-tertiary"
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

      {/* Outlet for modal routes like /messages/new */}
      <Outlet />
    </div>
  );
}
