import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard.local-data";
import { cn } from "~/lib/utils";

/**
 * CLIENT LOADER EXAMPLE
 *
 * Client loaders run in the browser and can access:
 * - IndexedDB
 * - Electric-SQL local database
 * - localStorage/sessionStorage
 * - Browser APIs
 *
 * This enables offline-first functionality and instant data access
 */
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  // TODO: Replace with actual Electric-SQL query
  // Example:
  // import { db } from '~/lib/electric'
  // const localPosts = await db.posts.findMany({
  //   where: { authorId: currentUserId },
  //   orderBy: { createdAt: 'desc' }
  // })

  // Simulate local database query
  const localData = {
    posts: [
      { id: "1", title: "Local-first Post", synced: true },
      { id: "2", title: "Offline Draft", synced: false },
    ],
    syncStatus: {
      lastSync: new Date().toISOString(),
      pendingChanges: 2,
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
 * - Mutate local database (Electric-SQL)
 * - Update IndexedDB
 * - Trigger background sync
 * - Provide optimistic UI updates
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const title = formData.get("title");

  if (intent === "create-local-post") {
    if (typeof title !== "string" || title.trim().length === 0) {
      return { error: "Title is required" };
    }

    // TODO: Replace with actual Electric-SQL mutation
    // Example:
    // await db.posts.create({
    //   data: {
    //     id: crypto.randomUUID(),
    //     title,
    //     authorId: currentUserId,
    //     createdAt: new Date(),
    //     synced: false
    //   }
    // })

    // Simulate local database write
    console.log("Creating local post:", title);

    // Trigger background sync if online
    if (navigator.onLine) {
      // await syncWithPeers()
    }

    return { success: true, message: "Post created locally!" };
  }

  if (intent === "sync-now") {
    // TODO: Trigger manual sync
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
                "bg-wallie-accent text-white",
                "hover:bg-wallie-accent-dim",
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
              {new Date(data.syncStatus.lastSync).toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Last Sync</p>
          </div>
        </div>
      </div>

      {/* Create local post */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Local Post</h2>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create-local-post" />

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
              "bg-wallie-accent text-white",
              "hover:bg-wallie-accent-dim",
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
  // Runs in browser, accesses local database
  const posts = await db.posts.findMany()
  return { posts, syncStatus }
}`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Client Action (Browser-side)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{`export async function clientAction({ request }) {
  // Runs in browser, mutates local data
  await db.posts.create({ data: newPost })
  await syncWithPeers()
  return { success: true }
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
