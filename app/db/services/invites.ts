/**
 * Invite Codes Service
 * Handles referral invite code generation, validation, and usage tracking
 */

import { db } from '../connection';
import { inviteCodes, referrals, users, profiles } from '../schema';
import type { InviteCode, NewInviteCode, Referral, NewReferral } from '../schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Types
// ============================================================================

export interface InviteCodeWithStats {
  code: string;
  generatedAt: Date | null;
  expiresAt: Date | null;
  isUsed: boolean;
  isExpired: boolean;
  canGenerateNew: boolean;
  nextAvailableAt: Date | null;
}

export interface ReferredUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  referredAt: Date | null;
}

export interface ReferrerInfo {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

// ============================================================================
// Invite Code Generation
// ============================================================================

/**
 * Generate a random 8-character URL-safe code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a code already exists in the database
 */
async function codeExists(code: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))
    .limit(1);

  return !!existing;
}

/**
 * Generate a unique code
 */
async function generateUniqueCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateCode();
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique invite code after multiple attempts');
    }
  } while (await codeExists(code));

  return code;
}

/**
 * Get or create invite code for a user
 * - Returns existing code if valid (not expired, not used)
 * - Creates new code if no valid code exists and at least 7 days have passed since last generation
 * - Returns null if user cannot generate a new code yet
 */
export async function getOrCreateInviteCode(userId: string): Promise<InviteCodeWithStats | null> {
  // Get the most recent invite code for this user
  const [latestCode] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.userId, userId))
    .orderBy(desc(inviteCodes.generatedAt))
    .limit(1);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // If no code exists, create one
  if (!latestCode) {
    const code = await generateUniqueCode();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const [newCode] = await db
      .insert(inviteCodes)
      .values({
        id: nanoid(),
        code,
        userId,
        generatedAt: now,
        expiresAt,
      })
      .returning();

    return {
      code: newCode.code,
      generatedAt: newCode.generatedAt,
      expiresAt: newCode.expiresAt,
      isUsed: false,
      isExpired: false,
      canGenerateNew: false,
      nextAvailableAt: new Date(newCode.generatedAt!.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // Check if the latest code is still valid
  const isUsed = !!latestCode.usedBy;
  const isExpired = latestCode.expiresAt < now;
  const canGenerateNew = latestCode.generatedAt! < sevenDaysAgo;

  // If code is valid (not used, not expired), return it
  if (!isUsed && !isExpired) {
    return {
      code: latestCode.code,
      generatedAt: latestCode.generatedAt,
      expiresAt: latestCode.expiresAt,
      isUsed: false,
      isExpired: false,
      canGenerateNew,
      nextAvailableAt: new Date(latestCode.generatedAt!.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // If code is invalid and user can generate a new one, create it
  if (canGenerateNew) {
    const code = await generateUniqueCode();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [newCode] = await db
      .insert(inviteCodes)
      .values({
        id: nanoid(),
        code,
        userId,
        generatedAt: now,
        expiresAt,
      })
      .returning();

    return {
      code: newCode.code,
      generatedAt: newCode.generatedAt,
      expiresAt: newCode.expiresAt,
      isUsed: false,
      isExpired: false,
      canGenerateNew: false,
      nextAvailableAt: new Date(newCode.generatedAt!.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // Cannot generate new code yet
  return {
    code: latestCode.code,
    generatedAt: latestCode.generatedAt,
    expiresAt: latestCode.expiresAt,
    isUsed,
    isExpired,
    canGenerateNew: false,
    nextAvailableAt: new Date(latestCode.generatedAt!.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}

// ============================================================================
// Invite Code Validation
// ============================================================================

/**
 * Validate an invite code
 * Returns the code details if valid, null otherwise
 */
export async function validateInviteCode(code: string): Promise<{ inviteCode: InviteCode; referrer: ReferrerInfo } | null> {
  const [inviteCode] = await db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      userId: inviteCodes.userId,
      generatedAt: inviteCodes.generatedAt,
      expiresAt: inviteCodes.expiresAt,
      usedBy: inviteCodes.usedBy,
      usedAt: inviteCodes.usedAt,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(inviteCodes)
    .innerJoin(users, eq(inviteCodes.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(inviteCodes.code, code))
    .limit(1);

  if (!inviteCode) {
    return null;
  }

  // Check if code is expired
  const now = new Date();
  if (inviteCode.expiresAt < now) {
    return null;
  }

  // Check if code is already used
  if (inviteCode.usedBy) {
    return null;
  }

  return {
    inviteCode: {
      id: inviteCode.id,
      code: inviteCode.code,
      userId: inviteCode.userId,
      generatedAt: inviteCode.generatedAt,
      expiresAt: inviteCode.expiresAt,
      usedBy: inviteCode.usedBy,
      usedAt: inviteCode.usedAt,
    },
    referrer: {
      id: inviteCode.userId,
      username: inviteCode.username,
      displayName: inviteCode.displayName,
      avatarUrl: inviteCode.avatarUrl,
    },
  };
}

// ============================================================================
// Invite Code Usage
// ============================================================================

/**
 * Mark an invite code as used and create a referral record
 */
export async function useInviteCode(code: string, newUserId: string): Promise<Referral> {
  // Get the invite code
  const [inviteCode] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))
    .limit(1);

  if (!inviteCode) {
    throw new Error('Invite code not found');
  }

  // Mark the code as used
  await db
    .update(inviteCodes)
    .set({
      usedBy: newUserId,
      usedAt: new Date(),
    })
    .where(eq(inviteCodes.code, code));

  // Create referral record
  const [referral] = await db
    .insert(referrals)
    .values({
      id: nanoid(),
      referrerId: inviteCode.userId,
      referredUserId: newUserId,
      inviteCode: code,
      createdAt: new Date(),
    })
    .returning();

  return referral;
}

// ============================================================================
// Referral Stats
// ============================================================================

/**
 * Get all users referred by a specific user
 */
export async function getReferredUsers(userId: string): Promise<ReferredUser[]> {
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      referredAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referredUserId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));

  return results;
}

/**
 * Get referral count for a user
 */
export async function getReferralCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  return result?.count || 0;
}

/**
 * Get who referred a specific user
 */
export async function getReferrer(userId: string): Promise<ReferrerInfo | null> {
  const [result] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.referrerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(referrals.referredUserId, userId))
    .limit(1);

  if (!result) {
    return null;
  }

  return result;
}
