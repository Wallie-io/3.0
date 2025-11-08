import { Form, Link, Outlet, useLoaderData, useLocation } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/_dashboard";
import { requireUserId, getSession } from "~/lib/session.server";
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mediumSidebarOpen, setMediumSidebarOpen] = useState(false);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-wallie-dark">
      {/* Mobile Top Bar (< md only) */}
      <div className="md:hidden h-16 bg-wallie-darker/70 backdrop-blur-xl border-b border-wallie-charcoal/50 flex items-center justify-between px-4 shrink-0">
        <Link to="/home">
          <h1 className="text-[20px] font-bold bg-gradient-to-r from-wallie-accent to-wallie-purple bg-clip-text text-transparent tracking-tight font-display cursor-pointer transition-colors">Wallie</h1>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center hover:bg-wallie-charcoal/50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Menu Overlay (< md only) */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Medium Screen Sidebar Overlay (md to lg only) */}
      <div
        className={cn(
          "hidden md:block lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          mediumSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMediumSidebarOpen(false)}
      />

      {/* Sidebar with three modes:
          - Mobile (< md): Hidden, slides from right when opened
          - Medium (md-lg): Icon-only on left, expands on click (overlays content)
          - Desktop (lg+): Full width always visible */}
      <aside className={cn(
        "bg-wallie-darker/70 backdrop-blur-xl border-r border-wallie-charcoal/50 flex flex-col transition-all duration-300",
        // Mobile: fixed right, full width, slides in
        "fixed top-0 right-0 bottom-0 z-50 w-64",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full",
        // Medium: fixed left, overlays content, width changes on expand
        "md:left-0 md:right-auto md:fixed md:translate-x-0",
        mediumSidebarOpen ? "md:w-64" : "md:w-20",
        // Desktop: static, full width always
        "lg:relative lg:w-64"
      )}>
        {/* Logo - Desktop only */}
        <div className="hidden lg:flex h-16 items-center px-6 border-b border-wallie-charcoal/50">
          <Link to="/home">
            <h1 className="text-[24px] font-bold bg-gradient-to-r from-wallie-accent to-wallie-purple bg-clip-text text-transparent tracking-tight font-display cursor-pointer transition-colors">Wallie</h1>
          </Link>
        </div>

        {/* Medium Screen Logo - Icon only, clickable to expand */}
        <div className="hidden md:flex lg:hidden h-16 items-center justify-center border-b border-wallie-charcoal/50">
          <button
            onClick={() => setMediumSidebarOpen(!mediumSidebarOpen)}
            className="w-10 h-10 flex items-center justify-center hover:bg-wallie-charcoal/50 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <span className="text-2xl text-wallie-accent">{mediumSidebarOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center justify-end px-4 border-b border-wallie-charcoal/50">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center hover:bg-wallie-charcoal/50 rounded-lg transition-colors"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 lg:py-6 space-y-1 lg:space-y-2">
          <NavLink
            to="/home"
            icon="🏠"
            mediumSidebarOpen={mediumSidebarOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setMediumSidebarOpen(false);
            }}
          >
            Home
          </NavLink>
          <NavLink
            to="/profile"
            icon="👤"
            mediumSidebarOpen={mediumSidebarOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setMediumSidebarOpen(false);
            }}
          >
            Profile
          </NavLink>
          <NavLink
            to="/messages"
            icon="💬"
            mediumSidebarOpen={mediumSidebarOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setMediumSidebarOpen(false);
            }}
          >
            Messages
          </NavLink>
          <NavLink
            to="/communities"
            icon="👥"
            mediumSidebarOpen={mediumSidebarOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setMediumSidebarOpen(false);
            }}
          >
            Communities
          </NavLink>
          <NavLink
            to="/hangouts"
            icon="🎙️"
            mediumSidebarOpen={mediumSidebarOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setMediumSidebarOpen(false);
            }}
          >
            Hangouts
          </NavLink>

          {/* Alerts moved to sidebar */}
          <button
            className={cn(
              "w-full flex items-center gap-3 rounded-lg",
              "font-medium text-sm",
              "transition-all duration-200",
              "text-wallie-text-secondary hover:text-wallie-text-primary hover:bg-wallie-charcoal/50",
              // Padding adjusts based on medium sidebar state
              mediumSidebarOpen ? "px-4 py-2.5 lg:py-3" : "md:px-2 md:py-2.5 md:justify-center lg:px-4 lg:py-3 lg:justify-start px-4 py-2.5"
            )}
          >
            <span className="text-xl">🔔</span>
            <span className={cn(
              // Hide text on medium screens when collapsed
              mediumSidebarOpen ? "block" : "md:hidden lg:block"
            )}>Alerts</span>
          </button>
        </nav>

        {/* User section */}
        <div className="p-3 lg:p-4 border-t border-wallie-charcoal/50 relative" data-user-menu>
          {/* Desktop: User menu dropdown */}
          {showUserMenu && (
            <div className="hidden lg:block absolute bottom-full left-0 right-0 mb-2 mx-4 bg-wallie-darker border border-wallie-charcoal/50 rounded-lg shadow-xl overflow-hidden">
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  "text-sm font-medium text-wallie-text-secondary",
                  "hover:text-wallie-text-primary hover:bg-wallie-charcoal/50",
                  "transition-all duration-200"
                )}
              >
                <span className="text-lg">⚙️</span>
                Settings
              </Link>
              <Form method="post" action="/api/logout">
                <button
                  type="submit"
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3",
                    "text-sm font-medium text-wallie-text-secondary",
                    "hover:text-wallie-text-primary hover:bg-wallie-charcoal/50",
                    "transition-all duration-200"
                  )}
                >
                  <span className="text-lg">🚪</span>
                  Sign Out
                </button>
              </Form>
            </div>
          )}

          {/* Medium & Desktop: User info - clickable to toggle menu */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "hidden md:flex w-full items-center gap-3 p-2 rounded-lg",
              "hover:bg-wallie-charcoal/50 transition-all duration-200",
              // Center content when icon-only on medium screens
              !mediumSidebarOpen && "md:justify-center lg:justify-start"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold shadow-wallie-glow-accent shrink-0">
              {email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className={cn(
              "flex-1 min-w-0 text-left",
              // Hide user details on medium when collapsed
              mediumSidebarOpen ? "block" : "md:hidden lg:block"
            )}>
              <p className="text-sm font-medium text-wallie-text-primary truncate">{email || "User"}</p>
              <p className="text-xs text-wallie-text-tertiary">
                <span className="inline-block w-2 h-2 rounded-full bg-wallie-success mr-1.5" />
                Online
              </p>
            </div>
            <span className={cn(
              "text-wallie-text-tertiary transition-transform duration-200",
              showUserMenu && "rotate-180",
              // Hide arrow on medium when collapsed
              mediumSidebarOpen ? "block" : "md:hidden lg:block"
            )}>
              ▲
            </span>
          </button>

          {/* Mobile: Inline user section without dropdown */}
          <div className="md:hidden space-y-1">
            {/* User info display */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold shadow-wallie-glow-accent text-sm">
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

            {/* Settings and Sign Out as buttons */}
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg",
                "text-sm font-medium text-wallie-text-secondary",
                "hover:text-wallie-text-primary hover:bg-wallie-charcoal/50",
                "transition-all duration-200"
              )}
            >
              <span className="text-lg">⚙️</span>
              Settings
            </Link>
            <Form method="post" action="/api/logout">
              <button
                type="submit"
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg",
                  "text-sm font-medium text-wallie-text-secondary",
                  "hover:text-wallie-text-primary hover:bg-wallie-charcoal/50",
                  "transition-all duration-200"
                )}
              >
                <span className="text-lg">🚪</span>
                Sign Out
              </button>
            </Form>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        // Add left margin on medium screens to account for icon-only sidebar
        "md:ml-20 lg:ml-0"
      )}>
        {/* Page content */}
        <main className={cn(
          "flex-1 p-4 lg:p-6 min-h-0",
          mobileMenuOpen && "overflow-hidden"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Navigation link component with active state styling
 * Supports icon-only mode on medium screens
 */
function NavLink({
  to,
  icon,
  children,
  onClick,
  mediumSidebarOpen,
}: {
  to: string;
  icon: string;
  children: React.ReactNode;
  onClick?: () => void;
  mediumSidebarOpen: boolean;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg",
        "font-medium text-sm",
        "transition-all duration-200",
        // Padding and justification adjust for icon-only mode
        mediumSidebarOpen
          ? "px-4 py-2.5 lg:py-3"
          : "md:px-2 md:py-2.5 md:justify-center lg:px-4 lg:py-3 lg:justify-start px-4 py-2.5",
        isActive
          ? "bg-wallie-accent text-wallie-dark shadow-wallie-glow-accent"
          : "text-wallie-text-secondary hover:text-wallie-text-primary hover:bg-wallie-charcoal/50"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className={cn(
        // Hide text on medium screens when sidebar is collapsed
        mediumSidebarOpen ? "block" : "md:hidden lg:block"
      )}>{children}</span>
    </Link>
  );
}
