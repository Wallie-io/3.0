import type { Route } from "./+types/api.logout";
import { destroySession } from "~/lib/session.server";

/**
 * Server Action: Handle logout
 * Resource route - no UI component
 */
export async function action({ request }: Route.ActionArgs) {
  return destroySession(request);
}
