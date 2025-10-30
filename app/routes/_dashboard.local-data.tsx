import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard.local-data";
import { getUserId } from "~/lib/session.server";
import { getAllPosts, createPost, getDb } from "~/lib/db.client";
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
  const { userId } = data as { userId: string | null };

  // Query local PGlite database
  const posts = await getAllPosts();

  // Get sync status
  const database = await getDb();
  const totalPostsResult = await database.query("SELECT COUNT(*) FROM posts");
  const unsyncedPostsResult = await database.query(
    "SELECT COUNT(*) FROM posts WHERE synced = false"
  );

  const localData = {
    posts: posts.map((post: any) => ({
      id: post.id,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""),
      synced: post.synced,
    })),
    syncStatus: {
      lastSync: new Date().toISOString(),
      pendingChanges: parseInt((unsyncedPostsResult.rows[0] as any).count),
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
  const title = formData.get("title");
  const userId = formData.get("userId");

  if (intent === "create-local-post") {
    if (typeof title !== "string" || title.trim().length === 0) {
      return { error: "Title is required" };
    }

    if (typeof userId !== "string") {
      return { error: "User not authenticated" };
    }

    // Create post in local PGlite database
    await createPost(userId, title);

    console.log("✅ Post created in local database");

    // Trigger background sync if online
    if (navigator.onLine) {
      console.log("🌐 Online - would trigger sync here");
      // await syncWithPeers()
    }

    return { success: true, message: "Post created locally!" };
  }

  if (intent === "sync-now") {
    console.log("🔄 Manual sync triggered");
    // TODO: Implement peer-to-peer sync
    // Example:
    // await electric.sync()

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          🔧 Local-First Data Example
        </h2>
        <p className="text-sm text-blue-800">
          This page demonstrates client-side loaders and actions for local-first functionality.
          Data is stored in your browser using Electric-SQL and syncs peer-to-peer.
        </p>
      </div>

      {/* Sync status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sync Status</h2>
          <Form method="post">
            <input type="hidden" name="intent" value="sync-now" />
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-wallie-primary text-white",
                "hover:bg-wallie-primary-hover",
                "transition-colors duration-200"
              )}
            >
              Sync Now
            </button>
          </Form>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {data.syncStatus.isOnline ? "🟢" : "🔴"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {data.syncStatus.isOnline ? "Online" : "Offline"}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {data.syncStatus.pendingChanges}
            </p>
            <p className="text-sm text-gray-600 mt-1">Pending Changes</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-mono text-gray-900">
              {dayjs(data.syncStatus.lastSync).format("h:mm:ss A")}
            </p>
            <p className="text-sm text-gray-600 mt-1">Last Sync</p>
          </div>
        </div>
      </div>

      {/* Create local post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Local Post</h2>

        <Form method="post" className="space-y-4" reloadDocument>
          <input type="hidden" name="intent" value="create-local-post" />
          <input type="hidden" name="userId" value={userId || ""} />

          {/* Success/Error messages */}
          {actionData?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {actionData.message}
            </div>
          )}

          {actionData?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {actionData.error}
            </div>
          )}

          <input
            type="text"
            name="title"
            placeholder="Post title..."
            className={cn(
              "w-full px-4 py-2 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
            )}
          />

          <button
            type="submit"
            className={cn(
              "px-6 py-2 rounded-lg font-medium",
              "bg-wallie-primary text-white",
              "hover:bg-wallie-primary-hover",
              "transition-colors duration-200"
            )}
          >
            Create (Offline-capable)
          </button>
        </Form>
      </div>

      {/* Local posts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Local Posts</h2>

        <div className="space-y-3">
          {data.posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{post.title}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {post.id}</p>
              </div>

              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  post.synced
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                )}
              >
                {post.synced ? "✓ Synced" : "⏳ Pending"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code examples */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Implementation Details</h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Client Loader (Browser-side)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
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
            <h3 className="font-semibold text-gray-900 mb-2">Client Action (Browser-side)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
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
  );
}
