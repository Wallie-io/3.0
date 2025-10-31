import { Form, Link, Outlet, useLoaderData } from "react-router";
import { useEffect, useState } from "react";
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
  const [isSyncing, setIsSyncing] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);

  // Sync user to local database
  useEffect(() => {
    // Only run once
    if (hasSynced) return;

    if (userId && email) {
      ensureUserInDatabase(userId, email)
        .then(() => {
          setIsSyncing(false);
          setHasSynced(true);
        })
        .catch((error) => {
          console.error("Failed to sync user:", error);
          setIsSyncing(false);
          setHasSynced(true);
        });
    } else {
      setIsSyncing(false);
      setHasSynced(true);
    }
  }, [userId, email, hasSynced]);

  return (
    <div className="h-screen flex bg-wallie-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-wallie-darker/70 backdrop-blur-xl border-r border-wallie-charcoal/50 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-wallie-charcoal/50">
          <h1 className="text-[24px] font-bold text-wallie-accent tracking-tight font-display">Wallie</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
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
        <div className="p-4 border-t border-wallie-charcoal/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold shadow-wallie-glow-accent">
              {email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-wallie-text-primary truncate">{email || "User"}</p>
              <p className="text-xs text-wallie-text-tertiary">
                <span className="inline-block w-2 h-2 rounded-full bg-wallie-success mr-1.5" />
                Online
              </p>
            </div>
          </div>

          {/* Logout button */}
          <Form method="post" action="/api/logout">
            <button
              type="submit"
              className={cn(
                "w-full py-2 px-4 rounded-lg text-sm font-medium",
                "text-wallie-text-secondary hover:text-wallie-text-primary",
                "hover:bg-wallie-charcoal/50",
                "transition-all duration-200"
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
        <header className="h-16 bg-wallie-darker/70 backdrop-blur-xl border-b border-wallie-charcoal/50 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-wallie-text-primary">Dashboard</h2>

          <div className="flex items-center gap-3">
            {/* Placeholder for search, notifications, etc. */}
            <button className="w-10 h-10 flex items-center justify-center hover:bg-wallie-charcoal/50 rounded-lg transition-colors">
              <span className="text-xl">🔔</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-wallie-charcoal/50 rounded-lg transition-colors">
              <span className="text-xl">⚙️</span>
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
  // TODO: Implement proper active state detection with useLocation or similar
  // For now, using a simple check based on pathname
  const isActive = typeof window !== "undefined" && window.location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "font-medium text-sm",
        "transition-all duration-200",
        isActive
          ? "bg-wallie-accent text-wallie-dark shadow-wallie-glow-accent"
          : "text-wallie-text-secondary hover:text-wallie-text-primary hover:bg-wallie-charcoal/50"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
