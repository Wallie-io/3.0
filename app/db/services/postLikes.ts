/**
 * Post Likes Service
 * Handles all post like-related database operations
 */

import { db } from '../connection';
import { postLikes, users, profiles } from '../schema';
import type { PostLike } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface PostLikeWithUser {
  userId: string;
  userName: string;
  userAvatar: string | null;
  createdAt: Date | null;
}

// ============================================================================
// Post Like Operations
// ============================================================================

/**
 * Like a post (handles duplicates gracefully with ON CONFLICT DO NOTHING)
 */
export async function likePost(postId: string, userId: string): Promise<boolean> {
  try {
    await db
      .insert(postLikes)
      .values({
        postId,
        userId,
      })
      .onConflictDoNothing();

    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
}

/**
 * Toggle like on a post (like if not liked, unlike if liked)
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
  // Check if already liked
  const existing = await hasUserLikedPost(postId, userId);

  if (existing) {
    await unlikePost(postId, userId);
    return { liked: false };
  } else {
    await likePost(postId, userId);
    return { liked: true };
  }
}

/**
 * Get all likes for a post with user information
 */
export async function getPostLikes(postId: string): Promise<PostLikeWithUser[]> {
  const result = await db
    .select({
      userId: postLikes.userId,
      userName: sql<string>`COALESCE(${profiles.displayName}, ${users.email})`,
      userAvatar: profiles.avatarUrl,
      createdAt: postLikes.createdAt,
    })
    .from(postLikes)
    .leftJoin(users, eq(postLikes.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(postLikes.postId, postId))
    .orderBy(postLikes.createdAt);

  return result;
}

/**
 * Check if a user has liked a specific post
 */
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  const [result] = await db
    .select()
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1);

  return !!result;
}

/**
 * Get like count for a post
 */
export async function getLikeCount(postId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  return Number(result?.count || 0);
}

/**
 * Get multiple posts' like counts in one query (batch operation)
 */
export async function getBatchLikeCounts(postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();

  const result = await db
    .select({
      postId: postLikes.postId,
      count: sql<number>`count(*)`,
    })
    .from(postLikes)
    .where(sql`${postLikes.postId} = ANY(${postIds})`)
    .groupBy(postLikes.postId);

  const countsMap = new Map<string, number>();
  result.forEach((row) => {
    countsMap.set(row.postId, Number(row.count));
  });

  return countsMap;
}
