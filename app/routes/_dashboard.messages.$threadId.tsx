import { Form, useLoaderData, useActionData, Link } from "react-router";
import type { Route } from "./+types/_dashboard.messages.$threadId";
import { getUserId } from "~/lib/session.server";
import { getMessagesByThreadId, createMessage, getDb } from "~/lib/db.client";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";

/**
 * Server Loader: Get user ID and thread ID
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const { threadId } = params;
  return { userId, threadId };
}

/**
 * Client Loader: Fetch messages from local database
 */
export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  const { userId, threadId } = data as { userId: string | null; threadId: string };

  if (!userId || !threadId) {
    return {
      thread: {
        id: "",
        recipientName: "Unknown",
        recipientAvatar: "?",
        recipientId: "",
      },
      messages: []
    };
  }

  // Fetch messages from local database
  const messages = await getMessagesByThreadId(threadId, userId);

  // Get thread participant info
  const database = await getDb();
  const participantResult = await database.query(
    `
    SELECT pr.display_name, pr.user_id
    FROM thread_participants tp
    JOIN profiles pr ON tp.user_id = pr.user_id
    WHERE tp.thread_id = $1 AND tp.user_id != $2
    LIMIT 1
  `,
    [threadId, userId]
  );

  const participant = participantResult.rows[0] as any;

  const thread = {
    id: threadId,
    recipientName: participant?.display_name || "Unknown",
    recipientAvatar: participant?.display_name?.[0]?.toUpperCase() || "?",
    recipientId: participant?.user_id || "",
  };

  // Format messages for display
  const formattedMessages = messages.map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.sender_id,
    timestamp: dayjs(msg.created_at).format("h:mm A"),
    isCurrentUser: msg.is_current_user,
  }));

  return { thread, messages: formattedMessages };
}

clientLoader.hydrate = true;

/**
 * Client Action: Send a new message
 */
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const { threadId } = params;
  const formData = await request.formData();
  const content = formData.get("content");
  const intent = formData.get("intent");
  const userId = formData.get("userId");

  if (intent === "send-message") {
    if (typeof content !== "string" || content.trim().length === 0) {
      return { error: "Message cannot be empty" };
    }

    if (typeof userId !== "string" || !threadId) {
      return { error: "Invalid request" };
    }

    // Create message in local database
    await createMessage(threadId, userId, content);

    return { success: true, message: "Message sent!" };
  }

  return null;
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Messages - ${params.threadId} - Wallie` },
    { name: "description", content: "End-to-end encrypted messaging" },
  ];
}

export default function Messages() {
  const { userId } = useLoaderData<typeof loader>();
  const { thread, messages } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">Thread not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Thread header */}
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <Link to="/messages" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          ← Back
        </Link>

        <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-white font-bold">
          {thread.recipientAvatar}
        </div>

        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{thread.recipientName}</h2>
          <p className="text-sm text-gray-500">🔒 End-to-end encrypted</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-white border-x border-gray-200 p-6 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-md px-4 py-3 rounded-2xl",
                message.isCurrentUser
                  ? "bg-wallie-primary text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              )}
            >
              <p>{message.content}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  message.isCurrentUser ? "text-white/70" : "text-gray-500"
                )}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4">
        {actionData?.error && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="flex gap-3" reloadDocument>
          <input type="hidden" name="intent" value="send-message" />
          <input type="hidden" name="userId" value={userId || ""} />

          <input
            type="text"
            name="content"
            placeholder="Type a message..."
            autoComplete="off"
            className={cn(
              "flex-1 px-4 py-3 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400"
            )}
          />

          <button
            type="submit"
            className={cn(
              "px-6 py-3 rounded-lg font-medium",
              "bg-wallie-primary text-white",
              "hover:bg-wallie-primary-hover",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Send
          </button>
        </Form>
      </div>
    </div>
  );
}
