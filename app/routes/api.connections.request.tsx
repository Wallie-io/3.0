/**
 * API Route: Request a connection with another user
 * POST /api/connections/request
 */

import { data } from "react-router";
import type { Route } from "./+types/api.connections.request";
import { requireUserId } from "~/lib/session.server";
import { requestConnection } from "~/db/services/connections";

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string" || !targetUserId) {
    return data(
      { error: "Target user ID is required", success: false },
      { status: 400 }
    );
  }

  try {
    const connection = await requestConnection(userId, targetUserId);

    return data({
      success: true,
      message: connection.status === 'accepted'
        ? "You are already connected with this user"
        : "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    console.error("Failed to request connection:", error);
    return data(
      {
        error: `Failed to request connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
