/**
 * API Route: Follow/Unfollow users
 * POST /api/follows - Follow a user
 * DELETE /api/follows - Unfollow a user
 */

import { data } from "react-router";
import type { Route } from "./+types/api.follows";
import { requireUserId } from "~/lib/session.server";
import { followUser, unfollowUser } from "~/db/services/connections";

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
    if (request.method === "POST") {
      // Follow user
      await followUser(userId, targetUserId);
      return data({
        success: true,
        message: "Successfully followed user",
      });
    } else if (request.method === "DELETE") {
      // Unfollow user
      const success = await unfollowUser(userId, targetUserId);
      if (!success) {
        return data(
          { error: "You are not following this user", success: false },
          { status: 400 }
        );
      }
      return data({
        success: true,
        message: "Successfully unfollowed user",
      });
    }

    return data(
      { error: "Method not allowed", success: false },
      { status: 405 }
    );
  } catch (error) {
    console.error("Failed to follow/unfollow user:", error);
    return data(
      {
        error: `Failed to perform action: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
