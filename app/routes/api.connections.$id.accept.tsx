/**
 * API Route: Accept a connection request
 * POST /api/connections/:id/accept
 */

import { data } from "react-router";
import type { Route } from "./+types/api.connections.$id.accept";
import { requireUserId } from "~/lib/session.server";
import { acceptConnection } from "~/db/services/connections";

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const connectionId = params.id;

  if (!connectionId) {
    return data(
      { error: "Connection ID is required", success: false },
      { status: 400 }
    );
  }

  try {
    const connection = await acceptConnection(connectionId, userId);

    return data({
      success: true,
      message: "Connection request accepted",
      connection,
    });
  } catch (error) {
    console.error("Failed to accept connection:", error);
    return data(
      {
        error: `Failed to accept connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: error instanceof Error && error.message.includes("Not authorized") ? 403 : 500 }
    );
  }
}
