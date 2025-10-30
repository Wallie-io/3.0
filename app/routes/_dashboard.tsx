import { Form, Link, Outlet, useLoaderData } from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/_dashboard";
import { requireUserId, getSession } from "~/lib/session.server";
import { ensureUserInDatabase } from "~/lib/sync.client";
import { cn } from "~/lib/utils";

/**
 * Loader: Validate user session and require authentication
 * Redirects to /login if not authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const session = await getSession(request);
  const email = session.get("email");

  return { userId, email };
}

/**
 * Dashboard layout with sidebar and topbar
 * All routes nested under this layout are protected and require authentication
 */
export default function DashboardLayout() {
  const { userId, email } = useLoaderData<typeof loader>();

  // Sync user to local database
  useEffect(() => {
    if (userId && email) {
      ensureUserInDatabase(userId, email).catch(console.error);
    }
  }, [userId, email]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-wallie-primary">Wallie</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLink to="/" icon="🏠">
            Home
          </NavLink>
          <NavLink to="/profile" icon="👤">
            Profile
          </NavLink>
          <NavLink to="/messages" icon="💬">
            Messages
          </NavLink>
          <NavLink to="/communities" icon="👥">
            Communities
          </NavLink>
          <NavLink to="/hangouts" icon="🎙️">
            Hangouts
          </NavLink>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-white font-bold">
              {email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{email || "User"}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>

          {/* Logout button */}
          <Form method="post" action="/api/logout">
            <button
              type="submit"
              className={cn(
                "w-full py-2 px-4 rounded-lg text-sm font-medium",
                "text-gray-700 hover:bg-gray-100",
                "transition-colors duration-200"
              )}
            >
              Sign Out
            </button>
          </Form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>

          <div className="flex items-center gap-4">
            {/* Placeholder for search, notifications, etc. */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              🔔
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              ⚙️
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Navigation link component with active state styling
 */
function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "text-gray-700 hover:bg-gray-100",
        "transition-colors duration-200",
        "font-medium text-sm"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
