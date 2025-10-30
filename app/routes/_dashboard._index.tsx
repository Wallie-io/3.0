import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard._index";
import { getUserId } from "~/lib/session.server";
import { cn } from "~/lib/utils";

/**
 * Loader: Fetch feed data
 * In a real app, this would fetch posts from the local database (Electric-SQL)
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // TODO: Replace with actual Electric-SQL query
  // Example: const posts = await db.posts.findMany({ orderBy: { createdAt: 'desc' } })

  // Mock data for demonstration
  const posts = [
    {
      id: "1",
      author: "Alice",
      content: "Just set up my Wallie account! Loving the local-first approach 🚀",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: "Bob",
      content: "The end-to-end encryption here is amazing. Finally a social network that respects privacy!",
      timestamp: "5 hours ago",
    },
    {
      id: "3",
      author: "Charlie",
      content: "Who else is excited about decentralized social networking? #Web3 #LocalFirst",
      timestamp: "1 day ago",
    },
  ];

  return { userId, posts };
}

/**
 * Action: Handle post creation
 */
export async function action({ request }: Route.ActionArgs) {
  const userId = await getUserId(request);
  const formData = await request.formData();
  const content = formData.get("content");
  const intent = formData.get("intent");

  if (intent === "create-post") {
    if (typeof content !== "string" || content.trim().length === 0) {
      return { error: "Post content cannot be empty" };
    }

    // TODO: Replace with actual Electric-SQL mutation
    // Example: await db.posts.create({ data: { content, authorId: userId } })

    return { success: true, message: "Post created successfully!" };
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Wallie" },
    { name: "description", content: "Your local-first social feed" },
  ];
}

export default function DashboardHome() {
  const { posts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create post form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a post</h2>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create-post" />

          {/* Success message */}
          {actionData?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {actionData.message}
            </div>
          )}

          {/* Error message */}
          {actionData?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {actionData.error}
            </div>
          )}

          <textarea
            name="content"
            rows={3}
            placeholder="What's on your mind?"
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "placeholder:text-gray-400 resize-none"
            )}
          />

          <button
            type="submit"
            className={cn(
              "px-6 py-2 rounded-lg font-medium",
              "bg-wallie-accent text-white",
              "hover:bg-wallie-accent-dim",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Post
          </button>
        </Form>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Feed</h2>

        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-white font-bold">
                {post.author[0]}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{post.author}</h3>
                  <span className="text-sm text-gray-500">• {post.timestamp}</span>
                </div>

                <p className="text-gray-700">{post.content}</p>

                {/* Post actions */}
                <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                  <button className="hover:text-wallie-accent transition-colors">
                    👍 Like
                  </button>
                  <button className="hover:text-wallie-accent transition-colors">
                    💬 Comment
                  </button>
                  <button className="hover:text-wallie-accent transition-colors">
                    🔄 Share
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
