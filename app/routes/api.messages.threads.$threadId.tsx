/**
 * API Route: Messages in a thread
 * GET /api/messages/threads/:threadId?cursor=xxx&limit=15 - Get messages
 * POST /api/messages/threads/:threadId - Send a message
 */

import type { Route } from "./+types/api.messages.threads.$threadId";
import { requireUserId } from "~/lib/session.server";
import {
  getMessagesInThread,
  sendMessage,
  isThreadParticipant,
  markMessagesAsRead,
} from "~/db/services/messages";

/**
 * GET: Fetch messages in a thread
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const { threadId } = params;

  if (!threadId) {
    return Response.json({ error: "Thread ID is required" }, { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await isThreadParticipant(threadId, userId);
  if (!isParticipant) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "15");

  const result = await getMessagesInThread(threadId, { cursor, limit });

  // Mark messages as read
  await markMessagesAsRead(threadId, userId);

  return Response.json(result);
}

/**
 * POST: Send a new message
 */
export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const { threadId } = params;

  if (!threadId) {
    return Response.json({ error: "Thread ID is required" }, { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await isThreadParticipant(threadId, userId);
  if (!isParticipant) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const content = formData.get("content");

  if (typeof content !== "string" || content.trim().length === 0) {
    return Response.json({ error: "Message content is required" }, { status: 400 });
  }

  if (content.length > 5000) {
    return Response.json({ error: "Message is too long (max 5000 characters)" }, { status: 400 });
  }

  const message = await sendMessage(threadId, userId, content.trim());

  return Response.json({ success: true, message });
}
