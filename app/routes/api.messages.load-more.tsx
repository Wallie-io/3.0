/**
 * API Route: Load More Messages
 * Handles infinite scroll pagination for messages
 */

import { data } from "react-router";
import type { Route } from "./+types/api.messages.load-more";
import { requireUserId } from "~/lib/session.server";
import { getMessagesInThread, isThreadParticipant } from "~/db/services/messages";
import dayjs from "dayjs";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");
  const cursor = url.searchParams.get("cursor");

  if (!threadId) {
    return data({ error: "Thread ID is required" }, { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await isThreadParticipant(threadId, userId);
  if (!isParticipant) {
    return data({ error: "Unauthorized" }, { status: 403 });
  }

  // Get older messages
  const result = await getMessagesInThread(threadId, {
    cursor: cursor || undefined,
    limit: 30,
  });

  // Format messages for display
  const messages = result.data.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    timestamp: msg.createdAt ? dayjs(msg.createdAt).format("h:mm A") : "",
    createdAt: msg.createdAt?.toISOString() || "",
    isCurrentUser: msg.senderId === userId,
    senderName: msg.senderDisplayName || msg.senderUsername || "Unknown",
    senderAvatar: (msg.senderDisplayName || msg.senderUsername || "?")[0].toUpperCase(),
  }));

  return data({
    messages,
    pagination: {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
  });
}
