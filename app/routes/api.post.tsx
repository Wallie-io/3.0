import { data } from "react-router";
import type { Route } from "./+types/api.post";
import { createPost } from "~/db/services/posts";
import { getUserId } from "~/lib/session.server";

/**
 * Server Action: Handle post creation in database
 * This is a resource route - no UI component, just the action
 */
export async function action({ request }: Route.ActionArgs) {
  // Get authenticated user
  const userId = await getUserId(request);
  if (!userId) {
    return data(
      { error: "User not authenticated", success: false },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const content = formData.get("content");
  const replyToId = formData.get("replyToId");

  // Validate content
  if (typeof content !== "string" || content.trim().length === 0) {
    return data(
      { error: "Post content cannot be empty", success: false },
      { status: 400 }
    );
  }

  // Validate replyToId if provided
  if (replyToId !== null && typeof replyToId !== "string") {
    return data(
      { error: "Invalid reply ID", success: false },
      { status: 400 }
    );
  }

  try {
    // Create post in database
    const post = await createPost({
      authorId: userId,
      content: content.trim(),
      replyToId: replyToId && replyToId.trim() !== "" ? replyToId : undefined,
    });

    // Return success - React Router will revalidate loaders automatically
    return data(
      {
        success: true,
        message: "Post created successfully!",
        post,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create post:", error);
    return data(
      {
        error: `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
