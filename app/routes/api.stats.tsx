import { data } from "react-router";
import type { Route } from "./+types/api.stats";

/**
 * Stats API Endpoint
 * Returns current platform statistics
 */
export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Replace with actual database queries
  // For now, return starting values
  const stats = {
    totalSignups: 0,
    onlineUsers: 0,
    lastUpdated: new Date().toISOString(),
  };

  return data(stats, {
    headers: {
      "Cache-Control": "public, max-age=60", // Cache for 1 minute
    },
  });
}
