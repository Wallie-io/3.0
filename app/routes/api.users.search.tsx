/**
 * API Route: Search for users
 * GET /api/users/search?q=searchterm&limit=10
 */

import { data } from "react-router";
import type { Route } from "./+types/api.users.search";
import { requireUserId } from "~/lib/session.server";
import { searchUsers } from "~/db/services/users";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request); // Ensure user is authenticated

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "10");

  if (query.trim().length < 2) {
    return data({
      data: [],
      message: "Search query must be at least 2 characters",
    });
  }

  const result = await searchUsers(query.trim(), { limit });

  // Format response for client
  const users = result.data.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.profile?.displayName || user.username || "Unknown",
    avatarUrl: user.profile?.avatarUrl || null,
    bio: user.profile?.bio || null,
  }));

  return data({ data: users });
}
