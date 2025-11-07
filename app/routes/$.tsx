import type { Route } from "./+types/$";

/**
 * Catch-all route for unmatched paths
 * Handles browser/devtools requests like /.well-known/* without logging errors
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  // Silently handle known browser/devtools paths
  if (url.pathname.startsWith("/.well-known/")) {
    return new Response(null, { status: 404 });
  }

  // For other 404s, return a proper error response
  throw new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-wallie-accent text-gray-900 rounded-lg font-medium hover:bg-wallie-accent-dim transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
