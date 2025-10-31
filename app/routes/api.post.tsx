import { redirect } from "react-router";
import { createPost, getUserById } from "~/lib/db.client";

/**
 * Client Action: Handle post creation in local database
 * This is a resource route - no UI component, just the action
 */
export async function clientAction({ request }: { request: Request }) {
  const formData = await request.formData();
  const content = formData.get("content");
  const userId = formData.get("userId");

  // Validate content
  if (typeof content !== "string" || content.trim().length === 0) {
    return {
      error: "Post content cannot be empty",
      success: false,
    };
  }

  // Validate userId
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return {
      error: "User not authenticated. Please refresh the page and try again.",
      success: false,
    };
  }

  try {
    // Check if user exists in local database
    const user = await getUserById(userId);
    if (!user) {
      return {
        error: "User not found in local database. Please refresh the page and try again.",
        success: false,
      };
    }

    // Create post in local database (PGlite)
    await createPost(userId, content.trim());

    // Return success - React Router will revalidate loaders automatically
    return {
      success: true,
      message: "Post created successfully!",
    };
  } catch (error) {
    console.error("Failed to create post:", error);
    return {
      error: `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}
