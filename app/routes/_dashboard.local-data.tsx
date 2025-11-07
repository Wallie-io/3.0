import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard.local-data";
import { getUserId } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";

/**
 * Server Loader: Get user ID from session
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  return { userId };
}

/**
 * CLIENT LOADER EXAMPLE
 *
 * Client loaders run in the browser and can access:
 * - PGlite (Postgres WASM) local database
 * - IndexedDB
 * - localStorage/sessionStorage
 * - Browser APIs
 *
 * This enables offline-first functionality and instant data access
 */
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();

  const localData = {
    posts: [] as Array<{ id: string; title: string; synced: boolean }>,
    syncStatus: {
      lastSync: new Date().toISOString(),
      pendingChanges: 0,
      isOnline: navigator.onLine,
    },
  };

  return localData;
}

/**
 * Hydrate with server data on initial load
 * This allows the page to work offline after first visit
 */
clientLoader.hydrate = true;

/**
 * CLIENT ACTION EXAMPLE
 *
 * Client actions run in the browser and can:
 * - Mutate local PGlite database
 * - Update IndexedDB
 * - Trigger background sync
 * - Provide optimistic UI updates
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-local-post") {
    return { error: "Local-first features are currently disabled" };
  }

  if (intent === "sync-now") {
    return { success: true, message: "Sync initiated!" };
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Local Data - Wallie" },
    { name: "description", content: "Local-first data demonstration" },
  ];
}

export default function LocalDataExample() {
  const { userId } = useLoaderData<typeof loader>();
  const data = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6">

        {/* Info banner - Full width */}
        <div className="col-span-12">
          <div className="bg-wallie-accent/10 border border-wallie-accent/20 rounded-2xl p-6">
            <h2 className="text-[18px] font-semibold text-wallie-accent mb-2">
              🔧 Local-First Data Example
            </h2>
            <p className="text-sm text-wallie-text-secondary">
              This page demonstrates client-side loaders and actions for local-first functionality.
              Data is stored in your browser using PGlite and syncs peer-to-peer.
            </p>
          </div>
        </div>

        {/* Sync Status Cards - 3 individual cards */}
        <div className="col-span-12 md:col-span-4">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-4xl mb-2">
              {data.syncStatus.isOnline ? "🟢" : "🔴"}
            </p>
            <p className="text-sm text-wallie-text-tertiary font-medium">
              {data.syncStatus.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-[32px] font-bold text-wallie-warning mb-1">
              {data.syncStatus.pendingChanges}
            </p>
            <p className="text-sm text-wallie-text-tertiary font-medium">Pending Changes</p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-sm font-mono text-wallie-text-primary mb-1">
              {dayjs(data.syncStatus.lastSync).format("h:mm:ss A")}
            </p>
            <p className="text-sm text-wallie-text-tertiary font-medium">Last Sync</p>
            <Form method="post" className="mt-3">
              <input type="hidden" name="intent" value="sync-now" />
              <button
                type="submit"
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium w-full",
                  "bg-wallie-accent/10 text-wallie-accent",
                  "hover:bg-wallie-accent/20",
                  "transition-all duration-200"
                )}
              >
                Sync Now
              </button>
            </Form>
          </div>
        </div>

        {/* Create local post */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10 p-6 h-full">
            <h2 className="text-[20px] font-semibold text-wallie-text-primary mb-4">Create Local Post</h2>

            <Form method="post" className="space-y-4" reloadDocument>
              <input type="hidden" name="intent" value="create-local-post" />
              <input type="hidden" name="userId" value={userId || ""} />

              {actionData?.success && (
                <div className="p-3 rounded-lg bg-wallie-success/10 border border-wallie-success/20 text-wallie-success text-sm">
                  {actionData.message}
                </div>
              )}

              {actionData?.error && (
                <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
                  {actionData.error}
                </div>
              )}

              <input
                type="text"
                name="title"
                placeholder="Post title..."
                className={cn(
                  "w-full px-4 py-3 rounded-lg",
                  "bg-wallie-slate text-wallie-text-primary",
                  "border border-wallie-charcoal",
                  "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                  "placeholder:text-wallie-text-muted",
                  "transition-all duration-200"
                )}
              />

              <button
                type="submit"
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold",
                  "bg-wallie-accent text-wallie-dark",
                  "shadow-wallie-glow-accent",
                  "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                  "transition-all duration-200",
                  "active:scale-[0.98]"
                )}
              >
                Create (Offline-capable)
              </button>
            </Form>
          </div>
        </div>

        {/* Local posts */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10 p-6 h-full">
            <h2 className="text-[20px] font-semibold text-wallie-text-primary mb-4">Local Posts</h2>

            <div className="space-y-3">
              {data.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 bg-wallie-slate/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-wallie-text-primary text-sm truncate">{post.title}</p>
                    <p className="text-xs text-wallie-text-tertiary mt-1 font-mono truncate">ID: {post.id}</p>
                  </div>

                  <div
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2",
                      post.synced
                        ? "bg-wallie-success/10 text-wallie-success"
                        : "bg-wallie-warning/10 text-wallie-warning"
                    )}
                  >
                    {post.synced ? "✓" : "⏳"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code examples */}
        <div className="col-span-12">
          <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h2 className="text-[20px] font-semibold text-wallie-text-primary mb-4">Implementation Details</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-wallie-text-secondary mb-2">Client Loader (Browser-side)</h3>
                <pre className="bg-wallie-void text-wallie-text-primary p-4 rounded-lg overflow-x-auto">
                  <code>{`export async function clientLoader() {
  // Runs in browser with PGlite (Postgres WASM)
  const posts = await getAllPosts()
  const unsyncedCount = await db.query(
    "SELECT COUNT(*) FROM posts WHERE synced = false"
  )
  return { posts, syncStatus }
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-wallie-text-secondary mb-2">Client Action (Browser-side)</h3>
                <pre className="bg-wallie-void text-wallie-text-primary p-4 rounded-lg overflow-x-auto">
                  <code>{`export async function clientAction({ request }) {
  // Runs in browser, writes to local PGlite database
  await createPost(userId, content)
  if (navigator.onLine) {
    await syncWithPeers()
  }
  return { success: true }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
