import { redirect } from "react-router";
import { createPost } from "~/lib/db.client";

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
      error: "User not authenticated",
      success: false,
    };
  }

  try {
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
      error: "Failed to create post. Please try again.",
      success: false,
    };
  }
}
