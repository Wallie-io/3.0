/**
 * API Route: Get thread participants
 * GET /api/messages/threads/:threadId/participants
 */

import type { Route } from "./+types/api.messages.threads.$threadId.participants";
import { requireUserId } from "~/lib/session.server";
import { getThreadById, isThreadParticipant } from "~/db/services/messages";

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

  const thread = await getThreadById(threadId);

  if (!thread) {
    return Response.json({ error: "Thread not found" }, { status: 404 });
  }

  return Response.json({ participants: thread.participants });
}
