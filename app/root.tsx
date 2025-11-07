import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { useTheme } from "./lib/use-theme";
import { getUserId } from "./lib/session.server";
import { getUserById } from "./db/services/users";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Momo+Trust+Display&display=swap",
  },
];

/**
 * Server Loader: Get user theme preference
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    return { theme: "system" };
  }

  try {
    const user = await getUserById(userId);
    return { theme: user?.theme || "system" };
  } catch (error) {
    console.error("Failed to load theme preference:", error);
    return { theme: "system" };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Get theme from loader data if available
  const data = useLoaderData<typeof loader>();
  const theme = data?.theme || "system";

  // Server-render with dark class if theme is explicitly "dark"
  // For "system" theme, let client-side handle it (brief flash acceptable)
  const isDark = theme === "dark";

  return (
    <html lang="en" className={isDark ? "dark" : undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const initialTheme = loaderData?.theme || "system";

  // Initialize theme
  useTheme(initialTheme as any);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
