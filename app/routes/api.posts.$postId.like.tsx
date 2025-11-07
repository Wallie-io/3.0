/**
 * Post Like Toggle API Route
 * Handles liking/unliking posts
 */

import { data } from 'react-router';
import type { Route } from './+types/api.posts.$postId.like';
import { toggleLike } from '~/db/services/postLikes';
import { getUserId } from '~/lib/session.server';

/**
 * POST /api/posts/:postId/like
 * Toggle like on a post
 */
export async function action({ params, request }: Route.ActionArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    return data(
      { error: 'User not authenticated', success: false },
      { status: 401 }
    );
  }

  const { postId } = params;

  if (!postId) {
    return data(
      { error: 'Post ID is required', success: false },
      { status: 400 }
    );
  }

  try {
    const result = await toggleLike(postId, userId);

    return data(
      {
        success: true,
        liked: result.liked,
        message: result.liked ? 'Post liked' : 'Post unliked',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return data(
      {
        error: `Failed to toggle like: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
