/**
 * Post Delete API Route
 * Handles deleting posts (by any logged-in user for moderation)
 */

import { data, redirect } from 'react-router';
import type { Route } from './+types/api.posts.$postId.delete';
import { deletePostAsModeration } from '~/db/services/posts';
import { requireUserId } from '~/lib/session.server';

/**
 * POST /api/posts/:postId/delete
 * Delete a post (any logged-in user can delete for moderation)
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
    const success = await deletePostAsModeration(postId, userId);

    if (!success) {
      return data(
        { error: 'Post not found', success: false },
        { status: 404 }
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
