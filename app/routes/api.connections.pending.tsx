/**
 * API Route: Get pending connection requests
 * GET /api/connections/pending
 */

import { data } from "react-router";
import type { Route } from "./+types/api.connections.pending";
import { requireUserId } from "~/lib/session.server";
import { getPendingConnectionRequests } from "~/db/services/connections";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  try {
    const pendingRequests = await getPendingConnectionRequests(userId);

    return data({
      success: true,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("Failed to get pending connection requests:", error);
    return data(
      {
        error: `Failed to get pending requests: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
