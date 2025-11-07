/**
 * Legacy PGlite Database Client (DEPRECATED)
 * This file is a stub for backward compatibility.
 * Please migrate to using services in ~/db/services instead.
 */

// Stub exports for backward compatibility
export function getDb() {
  throw new Error(
    'PGlite is no longer supported. Please use services from ~/db/services instead.'
  );
}

export function getAllPosts() {
  throw new Error(
    'getAllPosts is deprecated. Please use the new Postgres-based API.'
  );
}

export function createPost(userId: string, content: string) {
  throw new Error(
    'createPost is deprecated. Please use the new Postgres-based API.'
  );
}

export function getProfileByUserId(userId: string) {
  throw new Error(
    'getProfileByUserId is deprecated. Please use getUserWithProfile from ~/db/services/users.'
  );
}

export function updateProfile(userId: string, data: any) {
  throw new Error(
    'updateProfile is deprecated. Please use updateProfile from ~/db/services/users.'
  );
}

export function getThreadsForUser(userId: string) {
  throw new Error(
    'getThreadsForUser is deprecated. Please use getThreadsForUser from ~/db/services/messages.'
  );
}

export function getMessagesByThreadId(threadId: string, userId: string) {
  throw new Error(
    'getMessagesByThreadId is deprecated. Please use getMessagesInThread from ~/db/services/messages.'
  );
}

export function createMessage(threadId: string, userId: string, content: string) {
  throw new Error(
    'createMessage is deprecated. Please use sendMessage from ~/db/services/messages.'
  );
}

export function getThemePreference(userId: string) {
  throw new Error(
    'getThemePreference is deprecated. Theme is now stored in the users table.'
  );
}

export function setThemePreference(userId: string, theme: string) {
  throw new Error(
    'setThemePreference is deprecated. Please use updateUserTheme from ~/db/services/users.'
  );
}
