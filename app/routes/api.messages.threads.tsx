/**
 * API Route: Get all message threads for the current user
 * GET /api/messages/threads?cursor=xxx&limit=15
 */

import type { Route } from "./+types/api.messages.threads";
import { requireUserId } from "~/lib/session.server";
import { getThreadsForUser } from "~/db/services/messages";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "15");

  const result = await getThreadsForUser(userId, { cursor, limit });

  return Response.json(result);
}
