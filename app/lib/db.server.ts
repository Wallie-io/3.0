/**
 * Legacy Database Server Module (DEPRECATED)
 * This file is a stub for backward compatibility.
 * Please migrate to using services in ~/db/services instead.
 */

// Stub exports for backward compatibility
export function getUserById(id: string) {
  throw new Error(
    'getUserById from db.server is deprecated. Please use getUserById from ~/db/services/users.'
  );
}

export function createUser(data: any) {
  throw new Error(
    'createUser from db.server is deprecated. Please use createUser from ~/db/services/users.'
  );
}

export function getUserByEmail(email: string) {
  throw new Error(
    'getUserByEmail from db.server is deprecated. Please use getUserByEmail from ~/db/services/users.'
  );
}

export function createProfile(data: any) {
  throw new Error(
    'createProfile from db.server is deprecated. Please use createProfile from ~/db/services/users.'
  );
}

export function getCredentialById(credentialId: string) {
  throw new Error(
    'getCredentialById from db.server is deprecated. Please use getCredentialById from ~/db/services/users.'
  );
}

export function createCredential(data: any) {
  throw new Error(
    'createCredential from db.server is deprecated. Please use createCredential from ~/db/services/users.'
  );
}

export function updateCredentialCounter(credentialId: string, counter: number) {
  throw new Error(
    'updateCredentialCounter from db.server is deprecated. Please use updateCredentialCounter from ~/db/services/users.'
  );
}
