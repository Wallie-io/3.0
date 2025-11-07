/**
 * API Route: Create a new message thread
 * POST /api/messages/threads/create
 * Body: { recipientId: string, message?: string }
 */

import { data } from "react-router";
import type { Route } from "./+types/api.messages.threads.create";
import { requireUserId } from "~/lib/session.server";
import { getOrCreateThread, sendMessage } from "~/db/services/messages";
import { getUserById } from "~/db/services/users";

export async function action({ request }: Route.ActionArgs) {
  try {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const recipientId = formData.get("recipientId");
    const initialMessage = formData.get("message");

    if (typeof recipientId !== "string" || recipientId.trim().length === 0) {
      return data({ error: "Recipient ID is required" }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await getUserById(recipientId);
    if (!recipient) {
      return data({ error: "Recipient not found" }, { status: 404 });
    }

    // Get or create thread (self-messaging is allowed)
    const threadId = await getOrCreateThread(userId, recipientId);

    // Send initial message if provided
    if (typeof initialMessage === "string" && initialMessage.trim().length > 0) {
      await sendMessage(threadId, userId, initialMessage.trim());
    }

    return data({ success: true, threadId });
  } catch (error) {
    console.error("Failed to create thread:", error);
    return data({ error: "Failed to create thread" }, { status: 500 });
  }
}
