/**
 * Connections and Follows Service
 * Handles one-way follows and two-way connections between users
 */

import { db } from '../connection';
import { userFollows, userConnections, users, profiles } from '../schema';
import type { UserFollow, NewUserFollow, UserConnection, NewUserConnection } from '../schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface ConnectionRequest {
  id: string;
  userId1: string;
  userId2: string;
  status: string | null;
  initiatorId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  otherUser: UserProfile;
}

export interface RelationshipStatus {
  isFollowing: boolean;
  isFollower: boolean;
  isConnected: boolean;
  hasPendingRequest: boolean;
  isPendingFrom: boolean; // True if other user initiated connection request
}

// ============================================================================
// Follow Operations
// ============================================================================

/**
 * Follow a user (one-way)
 */
export async function followUser(followerId: string, followingId: string): Promise<UserFollow> {
  // Prevent self-follow
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following
  const [existing] = await db
    .select()
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create follow relationship
  const [follow] = await db
    .insert(userFollows)
    .values({
      followerId,
      followingId,
      createdAt: new Date(),
    })
    .returning();

  return follow;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const result = await db
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      )
    );

  return result.count > 0;
}

/**
 * Check if user A is following user B
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const [result] = await db
    .select()
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      )
    )
    .limit(1);

  return !!result;
}

/**
 * Get all users that a user is following
 */
export async function getFollowing(userId: string): Promise<UserProfile[]> {
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followingId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt));

  return results;
}

/**
 * Get all users following a user
 */
export async function getFollowers(userId: string): Promise<UserProfile[]> {
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
    .from(userFollows)
    .innerJoin(users, eq(userFollows.followerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(userFollows.followingId, userId))
    .orderBy(desc(userFollows.createdAt));

  return results;
}

/**
 * Get follower and following counts
 */
export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followersResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));

  const [followingResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));

  return {
    followers: followersResult?.count || 0,
    following: followingResult?.count || 0,
  };
}

// ============================================================================
// Connection Operations (Two-way)
// ============================================================================

/**
 * Request a connection (two-way) with another user
 */
export async function requestConnection(fromUserId: string, toUserId: string): Promise<UserConnection> {
  // Prevent self-connection
  if (fromUserId === toUserId) {
    throw new Error('Cannot connect with yourself');
  }

  // Ensure userId1 < userId2 alphabetically to prevent duplicates
  const [userId1, userId2] = fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];

  // Check if connection already exists
  const [existing] = await db
    .select()
    .from(userConnections)
    .where(
      and(
        eq(userConnections.userId1, userId1),
        eq(userConnections.userId2, userId2)
      )
    )
    .limit(1);

  if (existing) {
    // If already accepted, return it
    if (existing.status === 'accepted') {
      return existing;
    }
    // If pending, return it
    if (existing.status === 'pending') {
      return existing;
    }
    // If declined, update to pending with new initiator
    const [updated] = await db
      .update(userConnections)
      .set({
        status: 'pending',
        initiatorId: fromUserId,
        updatedAt: new Date(),
      })
      .where(eq(userConnections.id, existing.id))
      .returning();

    return updated;
  }

  // Create new connection request
  const [connection] = await db
    .insert(userConnections)
    .values({
      id: nanoid(),
      userId1,
      userId2,
      status: 'pending',
      initiatorId: fromUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return connection;
}

/**
 * Accept a connection request
 */
export async function acceptConnection(connectionId: string, userId: string): Promise<UserConnection> {
  const [connection] = await db
    .select()
    .from(userConnections)
    .where(eq(userConnections.id, connectionId))
    .limit(1);

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Verify user is part of this connection and not the initiator
  if (connection.userId1 !== userId && connection.userId2 !== userId) {
    throw new Error('Not authorized to accept this connection');
  }

  if (connection.initiatorId === userId) {
    throw new Error('Cannot accept your own connection request');
  }

  // Update status to accepted
  const [updated] = await db
    .update(userConnections)
    .set({
      status: 'accepted',
      updatedAt: new Date(),
    })
    .where(eq(userConnections.id, connectionId))
    .returning();

  return updated;
}

/**
 * Decline a connection request
 */
export async function declineConnection(connectionId: string, userId: string): Promise<UserConnection> {
  const [connection] = await db
    .select()
    .from(userConnections)
    .where(eq(userConnections.id, connectionId))
    .limit(1);

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Verify user is part of this connection and not the initiator
  if (connection.userId1 !== userId && connection.userId2 !== userId) {
    throw new Error('Not authorized to decline this connection');
  }

  if (connection.initiatorId === userId) {
    throw new Error('Cannot decline your own connection request');
  }

  // Update status to declined
  const [updated] = await db
    .update(userConnections)
    .set({
      status: 'declined',
      updatedAt: new Date(),
    })
    .where(eq(userConnections.id, connectionId))
    .returning();

  return updated;
}

/**
 * Remove a connection (disconnect)
 */
export async function removeConnection(userId1: string, userId2: string): Promise<boolean> {
  // Ensure alphabetical order
  const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const result = await db
    .delete(userConnections)
    .where(
      and(
        eq(userConnections.userId1, user1),
        eq(userConnections.userId2, user2)
      )
    );

  return result.count > 0;
}

/**
 * Get all accepted connections for a user
 */
export async function getConnections(userId: string): Promise<UserProfile[]> {
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
    .from(userConnections)
    .innerJoin(
      users,
      or(
        and(eq(userConnections.userId1, userId), eq(users.id, userConnections.userId2)),
        and(eq(userConnections.userId2, userId), eq(users.id, userConnections.userId1))
      )!
    )
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(
      and(
        or(eq(userConnections.userId1, userId), eq(userConnections.userId2, userId)),
        eq(userConnections.status, 'accepted')
      )
    )
    .orderBy(desc(userConnections.updatedAt));

  return results;
}

/**
 * Get pending connection requests for a user (where they are NOT the initiator)
 */
export async function getPendingConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
  const results = await db
    .select({
      id: userConnections.id,
      userId1: userConnections.userId1,
      userId2: userConnections.userId2,
      status: userConnections.status,
      initiatorId: userConnections.initiatorId,
      createdAt: userConnections.createdAt,
      updatedAt: userConnections.updatedAt,
      otherUserId: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
    })
    .from(userConnections)
    .innerJoin(
      users,
      eq(users.id, userConnections.initiatorId)
    )
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(
      and(
        or(eq(userConnections.userId1, userId), eq(userConnections.userId2, userId)),
        eq(userConnections.status, 'pending'),
        sql`${userConnections.initiatorId} != ${userId}`
      )
    )
    .orderBy(desc(userConnections.createdAt));

  return results.map(r => ({
    id: r.id,
    userId1: r.userId1,
    userId2: r.userId2,
    status: r.status,
    initiatorId: r.initiatorId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    otherUser: {
      id: r.otherUserId,
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      bio: r.bio,
    },
  }));
}

/**
 * Get connection count for a user
 */
export async function getConnectionCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(userConnections)
    .where(
      and(
        or(eq(userConnections.userId1, userId), eq(userConnections.userId2, userId)),
        eq(userConnections.status, 'accepted')
      )
    );

  return result?.count || 0;
}

/**
 * Check if two users are connected
 */
export async function areConnected(userId1: string, userId2: string): Promise<boolean> {
  const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const [result] = await db
    .select()
    .from(userConnections)
    .where(
      and(
        eq(userConnections.userId1, user1),
        eq(userConnections.userId2, user2),
        eq(userConnections.status, 'accepted')
      )
    )
    .limit(1);

  return !!result;
}

/**
 * Get complete relationship status between two users
 */
export async function getRelationshipStatus(currentUserId: string, otherUserId: string): Promise<RelationshipStatus> {
  // Check if current user is following other user
  const isFollowingCheck = await isFollowing(currentUserId, otherUserId);

  // Check if other user is following current user
  const isFollowerCheck = await isFollowing(otherUserId, currentUserId);

  // Check connection status
  const [user1, user2] = currentUserId < otherUserId ? [currentUserId, otherUserId] : [otherUserId, currentUserId];
  const [connection] = await db
    .select()
    .from(userConnections)
    .where(
      and(
        eq(userConnections.userId1, user1),
        eq(userConnections.userId2, user2)
      )
    )
    .limit(1);

  const isConnected = connection?.status === 'accepted';
  const hasPendingRequest = connection?.status === 'pending';
  const isPendingFrom = hasPendingRequest && connection?.initiatorId !== currentUserId;

  return {
    isFollowing: isFollowingCheck,
    isFollower: isFollowerCheck,
    isConnected,
    hasPendingRequest,
    isPendingFrom,
  };
}
