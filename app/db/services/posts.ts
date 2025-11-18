/**
 * Posts Service
 * Handles all post-related database operations
 */

import { db } from '../connection';
import { posts, users, profiles, postLikes } from '../schema';
import type { Post, NewPost } from '../schema';
import { eq, desc, sql, and, isNull, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export interface PostWithAuthor {
  id: string;
  content: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  synced: boolean | null;
  replyToId: string | null;
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  anonymousAuthor: string | null;
}

export interface PostWithStats extends PostWithAuthor {
  likeCount: number;
  replyCount: number;
  isLikedByUser?: boolean;
  replyToContent?: string | null; // First 50 chars of parent post
}

// ============================================================================
// Post Operations
// ============================================================================

/**
 * Get all posts with author information
 */
export async function getAllPosts(): Promise<PostWithAuthor[]> {
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      synced: posts.synced,
      replyToId: posts.replyToId,
      author_id: posts.authorId,
      author_name: sql<string>`COALESCE(${profiles.displayName}, ${users.email}, ${posts.anonymousAuthor}, 'Anonymous')`,
      author_avatar: profiles.avatarUrl,
      anonymousAuthor: posts.anonymousAuthor,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .orderBy(desc(posts.createdAt));

  return result;
}

/**
 * Get only top-level posts (no replies) with author information
 */
export async function getTopLevelPosts(): Promise<PostWithAuthor[]> {
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      synced: posts.synced,
      replyToId: posts.replyToId,
      author_id: posts.authorId,
      author_name: sql<string>`COALESCE(${profiles.displayName}, ${users.email})`,
      author_avatar: profiles.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(isNull(posts.replyToId))
    .orderBy(desc(posts.createdAt));

  return result;
}

/**
 * Get a single post by ID with author information
 */
export async function getPostById(postId: string): Promise<PostWithAuthor | null> {
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      synced: posts.synced,
      replyToId: posts.replyToId,
      author_id: posts.authorId,
      author_name: sql<string>`COALESCE(${profiles.displayName}, ${users.email})`,
      author_avatar: profiles.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(posts.id, postId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get replies for a specific post
 */
export async function getRepliesForPost(postId: string): Promise<PostWithAuthor[]> {
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      synced: posts.synced,
      replyToId: posts.replyToId,
      author_id: posts.authorId,
      author_name: sql<string>`COALESCE(${profiles.displayName}, ${users.email})`,
      author_avatar: profiles.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(posts.replyToId, postId))
    .orderBy(desc(posts.createdAt));

  return result;
}

/**
 * Get posts by a specific author
 */
export async function getPostsByAuthor(authorId: string): Promise<PostWithAuthor[]> {
  const result = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      synced: posts.synced,
      replyToId: posts.replyToId,
      author_id: posts.authorId,
      author_name: sql<string>`COALESCE(${profiles.displayName}, ${users.email})`,
      author_avatar: profiles.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(posts.authorId, authorId))
    .orderBy(desc(posts.createdAt));

  return result;
}

/**
 * Get a post with stats (like count, reply count) and optionally check if user liked it
 */
export async function getPostWithStats(
  postId: string,
  userId?: string
): Promise<PostWithStats | null> {
  // Get the post with author info
  const post = await getPostById(postId);
  if (!post) return null;

  // Count likes
  const [likeCountResult] = await db
    .select({ count: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));

  // Count replies
  const [replyCountResult] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.replyToId, postId));

  // Check if user liked this post
  let isLikedByUser = false;
  if (userId) {
    const [userLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);
    isLikedByUser = !!userLike;
  }

  return {
    ...post,
    likeCount: Number(likeCountResult.count),
    replyCount: Number(replyCountResult.count),
    isLikedByUser,
  };
}

/**
 * Get top-level posts with stats
 */
export async function getTopLevelPostsWithStats(userId?: string): Promise<PostWithStats[]> {
  const topLevelPosts = await getTopLevelPosts();

  // Get stats for all posts in parallel
  const postsWithStats = await Promise.all(
    topLevelPosts.map(async (post) => {
      // Count likes for this post
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, post.id));

      // Count replies for this post
      const [replyCountResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.replyToId, post.id));

      // Check if user liked this post
      let isLikedByUser = false;
      if (userId) {
        const [userLike] = await db
          .select()
          .from(postLikes)
          .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)))
          .limit(1);
        isLikedByUser = !!userLike;
      }

      return {
        ...post,
        likeCount: Number(likeCountResult.count),
        replyCount: Number(replyCountResult.count),
        isLikedByUser,
      };
    })
  );

  return postsWithStats;
}

/**
 * Create a new post
 */
export async function createPost(data: {
  id?: string;
  authorId?: string | null;
  anonymousAuthor?: string | null;
  content: string;
  replyToId?: string;
  synced?: boolean;
}): Promise<Post> {
  const postId = data.id || nanoid();

  const [post] = await db
    .insert(posts)
    .values({
      id: postId,
      authorId: data.authorId || null,
      anonymousAuthor: data.anonymousAuthor || null,
      content: data.content,
      replyToId: data.replyToId,
      synced: data.synced ?? true,
    })
    .returning();

  return post;
}

/**
 * Delete a post by ID (only if userId matches the author)
 * @param postId - The post ID to delete
 * @param userId - The user ID attempting the deletion (must be the author)
 * @returns true if deleted, false if not found or unauthorized
 */
export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Update a post (only if userId matches the author)
 * @param postId - The post ID to update
 * @param userId - The user ID attempting the update (must be the author)
 * @param data - The data to update
 * @returns Updated post or null if not found or unauthorized
 */
export async function updatePost(
  postId: string,
  userId: string,
  data: { content?: string; synced?: boolean }
): Promise<Post | null> {
  const [post] = await db
    .update(posts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.authorId, userId)))
    .returning();

  return post || null;
}

/**
 * Get all posts for public feed with stats and parent context
 * Includes both top-level posts and replies
 * For replies, includes first 50 chars of parent post
 */
export async function getAllPostsForPublicFeed(userId?: string): Promise<PostWithStats[]> {
  const allPosts = await getAllPosts();

  // Get stats for all posts in parallel
  const postsWithStats = await Promise.all(
    allPosts.map(async (post) => {
      // Count likes for this post
      const [likeCountResult] = await db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, post.id));

      // Count replies for this post
      const [replyCountResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.replyToId, post.id));

      // Check if user liked this post
      let isLikedByUser = false;
      if (userId) {
        const [userLike] = await db
          .select()
          .from(postLikes)
          .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)))
          .limit(1);
        isLikedByUser = !!userLike;
      }

      // If this is a reply, get first 50 chars of parent post
      let replyToContent: string | null = null;
      if (post.replyToId) {
        const parentPost = await getPostById(post.replyToId);
        if (parentPost) {
          replyToContent = parentPost.content.substring(0, 50);
          if (parentPost.content.length > 50) {
            replyToContent += '...';
          }
        }
      }

      return {
        ...post,
        likeCount: Number(likeCountResult.count),
        replyCount: Number(replyCountResult.count),
        isLikedByUser,
        replyToContent,
      };
    })
  );

  return postsWithStats;
}

/**
 * Delete a post by ID - allows any logged-in user (for moderation)
 * @param postId - The post ID to delete
 * @param userId - The user ID attempting the deletion (must be logged in)
 * @returns true if deleted, false if not found
 */
export async function deletePostAsModeration(postId: string, userId: string): Promise<boolean> {
  // Verify user is logged in (has a valid userId)
  if (!userId) {
    return false;
  }

  const result = await db
    .delete(posts)
    .where(eq(posts.id, postId))
    .returning();

  return result.length > 0;
}
