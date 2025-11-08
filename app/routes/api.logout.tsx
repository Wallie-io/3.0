import type { Route } from "./+types/api.logout";
import { destroySession, getUserId } from "~/lib/session.server";
import { updateUserPresence } from "~/db/services/users";

/**
 * Server Action: Handle logout
 * Resource route - no UI component
 */
export async function action({ request }: Route.ActionArgs) {
  // Set user as offline before logging out
  const userId = await getUserId(request);
  if (userId) {
    await updateUserPresence(userId, 'offline');
  }

  return destroySession(request);
}
