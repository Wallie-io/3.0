/**
 * Client-side sync utilities
 * Syncs session data with local database
 */

import { createUser, createProfile, getUserById } from "./db.client";

/**
 * Ensures the current user exists in the local database
 * Called after login/signup to sync session with local data
 */
export async function ensureUserInDatabase(userId: string, email: string) {
  try {
    // Check if user already exists
    const existingUser = await getUserById(userId);

    if (existingUser) {
      // User already exists, nothing to do
      return;
    }

    // Create user if doesn't exist
    // Pass username as undefined, email as third parameter
    await createUser(userId, undefined, email);

    // Create default profile
    const displayName = email.split("@")[0];
    await createProfile(userId, displayName);

    console.log("✅ User synced to local database");
  } catch (error) {
    // Check if it's a duplicate key error - if so, treat as success
    if (error instanceof Error && error.message.includes("duplicate key")) {
      console.log("✅ User already exists in local database");
      return;
    }

    // Check if it's a unique constraint error - if so, treat as success
    if (error instanceof Error && error.message.includes("unique constraint")) {
      console.log("✅ User already exists in local database");
      return;
    }

    console.error("Failed to sync user to database:", error);
    throw error;
  }
}
