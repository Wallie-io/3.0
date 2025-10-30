import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/_dashboard.messages._index";
import { getUserId } from "~/lib/session.server";
import { cn } from "~/lib/utils";

/**
 * Loader: Fetch message threads/conversations
 * In a real app, this would fetch from Electric-SQL
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // TODO: Replace with actual Electric-SQL query
  // Example: const threads = await db.threads.findMany({
  //   where: { participants: { some: { userId } } },
  //   orderBy: { lastMessageAt: 'desc' }
  // })

  // Mock data for demonstration
  const threads = [
    {
      id: "alice",
      recipientName: "Alice",
      recipientAvatar: "A",
      lastMessage: "The E2E encryption is really impressive!",
      lastMessageTime: "2 min ago",
      unread: true,
    },
    {
      id: "bob",
      recipientName: "Bob",
      recipientAvatar: "B",
      lastMessage: "See you at the meetup!",
      lastMessageTime: "1 hour ago",
      unread: false,
    },
    {
      id: "charlie",
      recipientName: "Charlie",
      recipientAvatar: "C",
      lastMessage: "Thanks for the help!",
      lastMessageTime: "Yesterday",
      unread: false,
    },
  ];

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
