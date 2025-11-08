/**
 * Users Service
 * Handles all user and profile-related database operations
 */

import { db } from '../connection';
import { users, profiles, credentials } from '../schema';
import type { User, NewUser, Profile, NewProfile, Credential, NewCredential } from '../schema';
import { eq, and, desc, sql, or, like, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UserWithProfile {
  id: string;
  username: string | null;
  email: string | null;
  theme: string | null;
  createdAt: Date | null;
  profile: {
    id: string;
    displayName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatarUrl: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  } | null;
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(data: {
  id?: string;
  username?: string;
  email: string;
  theme?: string;
}): Promise<User> {
  const userId = data.id || nanoid();

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      username: data.username,
      email: data.email,
      theme: data.theme || 'system',
    })
    .returning();

  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return user || null;
}

/**
 * Get user with profile by ID
 */
export async function getUserWithProfile(id: string): Promise<UserWithProfile | null> {
  const [result] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      theme: users.theme,
      createdAt: users.createdAt,
      profileId: profiles.id,
      profileUserId: profiles.userId,
      displayName: profiles.displayName,
      bio: profiles.bio,
      location: profiles.location,
      website: profiles.website,
      avatarUrl: profiles.avatarUrl,
      profileCreatedAt: profiles.createdAt,
      profileUpdatedAt: profiles.updatedAt,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, id))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    username: result.username,
    email: result.email,
    theme: result.theme,
    createdAt: result.createdAt,
    profile: result.profileId ? {
      id: result.profileId,
      displayName: result.displayName,
      bio: result.bio,
      location: result.location,
      website: result.website,
      avatarUrl: result.avatarUrl,
      createdAt: result.profileCreatedAt,
      updatedAt: result.profileUpdatedAt,
    } : null,
  };
}

/**
 * Update user theme
 */
export async function updateUserTheme(
  userId: string,
  theme: string
): Promise<User | null> {
  const [updated] = await db
    .update(users)
    .set({ theme })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

/**
 * Search users by username or display name (paginated)
 */
export async function searchUsers(
  query: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<PaginatedResponse<UserWithProfile>> {
  const limit = options.limit || 15;
  const searchPattern = `%${query}%`;

  // Build where conditions
  const searchCondition = or(
    like(users.username, searchPattern),
    like(profiles.displayName, searchPattern)
  );

  const whereConditions = options.cursor
    ? and(
        searchCondition,
        sql`${users.createdAt} < ${new Date(options.cursor)}`
      )
    : searchCondition;

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      theme: users.theme,
      createdAt: users.createdAt,
      profileId: profiles.id,
      profileUserId: profiles.userId,
      displayName: profiles.displayName,
      bio: profiles.bio,
      location: profiles.location,
      website: profiles.website,
      avatarUrl: profiles.avatarUrl,
      profileCreatedAt: profiles.createdAt,
      profileUpdatedAt: profiles.updatedAt,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(whereConditions)
    .orderBy(desc(users.createdAt))
    .limit(limit + 1);
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  const data: UserWithProfile[] = items.map(result => ({
    id: result.id,
    username: result.username,
    email: result.email,
    theme: result.theme,
    createdAt: result.createdAt,
    profile: result.profileId ? {
      id: result.profileId,
      displayName: result.displayName,
      bio: result.bio,
      location: result.location,
      website: result.website,
      avatarUrl: result.avatarUrl,
      createdAt: result.profileCreatedAt,
      updatedAt: result.profileUpdatedAt,
    } : null,
  }));

  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].createdAt?.toISOString() || null
    : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Create a new profile for a user
 */
export async function createProfile(data: {
  userId: string;
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
}): Promise<Profile> {
  const profileId = nanoid();

  const [profile] = await db
    .insert(profiles)
    .values({
      id: profileId,
      userId: data.userId,
      displayName: data.displayName,
      bio: data.bio,
      location: data.location,
      website: data.website,
      avatarUrl: data.avatarUrl,
    })
    .returning();

  return profile;
}

/**
 * Get profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile || null;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatarUrl?: string;
  }
): Promise<Profile | null> {
  const [updated] = await db
    .update(profiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId))
    .returning();

  return updated || null;
}

/**
 * Delete a profile
 */
export async function deleteProfile(userId: string): Promise<boolean> {
  const result = await db
    .delete(profiles)
    .where(eq(profiles.userId, userId));

  return result.count > 0;
}

// ============================================================================
// WebAuthn Credential Operations
// ============================================================================

/**
 * Create a new credential (passkey)
 */
export async function createCredential(data: {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter?: number;
  transports?: string;
}): Promise<Credential> {
  const [credential] = await db
    .insert(credentials)
    .values({
      id: data.id,
      userId: data.userId,
      credentialId: data.credentialId,
      publicKey: data.publicKey,
      counter: data.counter || 0,
      transports: data.transports,
    })
    .returning();

  return credential;
}

/**
 * Get credential by credential ID
 */
export async function getCredentialById(credentialId: string): Promise<Credential | null> {
  const [credential] = await db
    .select()
    .from(credentials)
    .where(eq(credentials.credentialId, credentialId))
    .limit(1);

  return credential || null;
}

/**
 * Get all credentials for a user
 */
export async function getCredentialsByUserId(userId: string): Promise<Credential[]> {
  return await db
    .select()
    .from(credentials)
    .where(eq(credentials.userId, userId));
}

/**
 * Update credential counter
 */
export async function updateCredentialCounter(
  credentialId: string,
  counter: number
): Promise<Credential | null> {
  const [updated] = await db
    .update(credentials)
    .set({ counter })
    .where(eq(credentials.credentialId, credentialId))
    .returning();

  return updated || null;
}

/**
 * Delete a credential
 */
export async function deleteCredential(credentialId: string): Promise<boolean> {
  const result = await db
    .delete(credentials)
    .where(eq(credentials.credentialId, credentialId));

  return result.count > 0;
}

/**
 * Get total count of users
 */
export async function getTotalUserCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  return Number(result[0]?.count || 0);
}
