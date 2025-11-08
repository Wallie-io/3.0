import { data } from "react-router";
import type { Route } from "./+types/api.stats";
import { getTotalUserCount, getOnlineUserCount } from "~/db/services/users";

/**
 * Stats API Endpoint
 * Returns current platform statistics
 */
export async function loader({ request }: Route.LoaderArgs) {
  const totalSignups = await getTotalUserCount();
  const onlineUsers = await getOnlineUserCount();

  const stats = {
    totalSignups,
    onlineUsers,
    lastUpdated: new Date().toISOString(),
  };

  return data(stats, {
    headers: {
      "Cache-Control": "no-cache", // Don't cache, we want fresh data
    },
  });
}
