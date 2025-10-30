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

    if (!existingUser) {
      // Create user if doesn't exist
      await createUser(userId, email);

      // Create default profile
      const displayName = email.split("@")[0];
      await createProfile(userId, displayName);

      console.log("✅ User synced to local database");
    }
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    throw error;
  }
}
