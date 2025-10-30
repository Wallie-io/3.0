import { Form, useLoaderData, useParams, useActionData, Link } from "react-router";
import type { Route } from "./+types/_dashboard.messages.$threadId";
import { getUserId } from "~/lib/session.server";
import { cn } from "~/lib/utils";

/**
 * Loader: Fetch messages for a specific thread
 * In a real app, this would fetch from Electric-SQL with E2EE decryption
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const { threadId } = params;

  // TODO: Replace with actual Electric-SQL query
  // Example: const messages = await db.messages.findMany({
  //   where: { threadId },
  //   orderBy: { createdAt: 'asc' }
  // })

  // Mock data for demonstration
  const thread = {
    id: threadId,
    recipientName: threadId === "alice" ? "Alice" : "Bob",
    recipientAvatar: threadId === "alice" ? "A" : "B",
  };

  const messages = [
    {
      id: "1",
      content: "Hey! How are you?",
      senderId: threadId,
      timestamp: "10:30 AM",
      isCurrentUser: false,
    },
    {
      id: "2",
      content: "I'm great! Just exploring this new local-first platform.",
      senderId: userId || "me",
      timestamp: "10:32 AM",
      isCurrentUser: true,
    },
    {
      id: "3",
      content: "The E2E encryption is really impressive!",
      senderId: threadId,
      timestamp: "10:33 AM",
      isCurrentUser: false,
    },
  ];

  return { thread, messages, userId };
}

/**
 * Action: Send a new message
 * In a real app, this would encrypt the message and store it locally
 */
export async function action({ request, params }: Route.ActionArgs) {
  const userId = await getUserId(request);
  const { threadId } = params;
  const formData = await request.formData();
  const content = formData.get("content");
  const intent = formData.get("intent");

  if (intent === "send-message") {
    if (typeof content !== "string" || content.trim().length === 0) {
      return { error: "Message cannot be empty" };
    }

    // TODO: Replace with actual Electric-SQL mutation with E2EE
    // Example:
    // const encrypted = await encrypt(content, recipientPublicKey)
    // await db.messages.create({
    //   data: { content: encrypted, threadId, senderId: userId }
    // })

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
  const { thread, messages } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
                  ? "bg-wallie-accent text-white rounded-br-sm"
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

        <Form method="post" className="flex gap-3">
          <input type="hidden" name="intent" value="send-message" />

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
              "bg-wallie-accent text-white",
              "hover:bg-wallie-accent-dim",
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
