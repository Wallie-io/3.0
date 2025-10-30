import { redirect } from "react-router";
import type { Route } from "./+types/home";

/**
 * Redirect /home to / (dashboard index)
 */
export async function loader({}: Route.LoaderArgs) {
  return redirect("/");
}
