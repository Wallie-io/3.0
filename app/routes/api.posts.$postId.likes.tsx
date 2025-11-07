/**
 * Post Likes API Route
 * Get list of users who liked a post
 */

import { data } from 'react-router';
import type { Route } from './+types/api.posts.$postId.likes';
import { getPostLikes } from '~/db/services/postLikes';

/**
 * GET /api/posts/:postId/likes
 * Get all users who liked a post
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { postId } = params;

  if (!postId) {
    return data(
      { error: 'Post ID is required', likes: [] },
      { status: 400 }
    );
  }

  try {
    const likes = await getPostLikes(postId);

    return data(
      {
        success: true,
        likes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to get likes:', error);
    return data(
      {
        error: `Failed to get likes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        likes: [],
      },
      { status: 500 }
    );
  }
}
