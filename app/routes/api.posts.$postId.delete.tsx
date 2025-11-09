/**
 * Post Delete API Route
 * Handles deleting posts (only by author)
 */

import { data, redirect } from 'react-router';
import type { Route } from './+types/api.posts.$postId.delete';
import { deletePost } from '~/db/services/posts';
import { requireUserId } from '~/lib/session.server';

/**
 * POST /api/posts/:postId/delete
 * Delete a post (only if current user is the author)
 */
export async function action({ params, request }: Route.ActionArgs) {
  const userId = await requireUserId(request);

  const { postId } = params;

  if (!postId) {
    return data(
      { error: 'Post ID is required', success: false },
      { status: 400 }
    );
  }

  try {
    const success = await deletePost(postId, userId);

    if (!success) {
      return data(
        { error: 'Post not found or you are not authorized to delete it', success: false },
        { status: 403 }
      );
    }

    return data(
      {
        success: true,
        message: 'Post deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete post:', error);
    return data(
      {
        error: `Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
