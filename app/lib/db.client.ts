/**
 * PGlite Database Client
 * Local-first database running in the browser using WASM Postgres
 */

import { PGlite } from "@electric-sql/pglite";

// PGlite instance (will be initialized asynchronously)
let db: PGlite;
let dbInitPromise: Promise<PGlite> | null = null;

/**
 * Get or create the database instance
 */
async function getDb(): Promise<PGlite> {
  if (db) return db;

  if (!dbInitPromise) {
    dbInitPromise = PGlite.create("idb://wallie-db");
  }

  db = await dbInitPromise;
  return db;
}

/**
 * Database Schema
 * Creates all tables needed for Wallie
 */
export async function initializeDatabase() {
  try {
    const database = await getDb();

    // Users table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // WebAuthn Credentials table (passkeys)
    await database.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        transports TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Profiles table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        bio TEXT,
        location TEXT,
        website TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    // Posts table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE
      );
    `);

    // Message threads table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS message_threads (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Thread participants table (many-to-many)
    await database.exec(`
      CREATE TABLE IF NOT EXISTS thread_participants (
        thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (thread_id, user_id)
      );
    `);

    // Messages table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        encrypted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE
      );
    `);

    // Create indexes for better query performance
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON thread_participants(user_id);
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

/**
 * Database query helpers
 */

// Users
export async function createUser(
  id: string,
  username?: string,
  email?: string
) {
  const database = await getDb();
  const result = await database.query(
    "INSERT INTO users (id, username, email) VALUES ($1, $2, $3) RETURNING *",
    [id, username || null, email || null]
  );
  return result.rows[0];
}

export async function getUserById(id: string) {
  const database = await getDb();
  const result = await database.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getUserByUsername(username: string) {
  const database = await getDb();
  const result = await database.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const database = await getDb();
  const result = await database.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
}

// Credentials (Passkeys)
export async function createCredential(
  userId: string,
  credentialId: string,
  publicKey: string,
  counter: number,
  transports?: string[]
) {
  const database = await getDb();
  const id = crypto.randomUUID();
  const result = await database.query(
    `INSERT INTO credentials (id, user_id, credential_id, public_key, counter, transports)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      id,
      userId,
      credentialId,
      publicKey,
      counter,
      transports ? JSON.stringify(transports) : null,
    ]
  );
  return result.rows[0];
}

export async function getCredentialByCredentialId(credentialId: string) {
  const database = await getDb();
  const result = await database.query(
    "SELECT * FROM credentials WHERE credential_id = $1",
    [credentialId]
  );
  return result.rows[0];
}

export async function getCredentialsByUserId(userId: string) {
  const database = await getDb();
  const result = await database.query(
    "SELECT * FROM credentials WHERE user_id = $1",
    [userId]
  );
  return result.rows;
}

export async function updateCredentialCounter(
  credentialId: string,
  counter: number
) {
  const database = await getDb();
  const result = await database.query(
    "UPDATE credentials SET counter = $1 WHERE credential_id = $2 RETURNING *",
    [counter, credentialId]
  );
  return result.rows[0];
}

// Profiles
export async function createProfile(userId: string, displayName: string) {
  const database = await getDb();
  const id = crypto.randomUUID();
  const result = await database.query(
    `INSERT INTO profiles (id, user_id, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, userId, displayName]
  );
  return result.rows[0];
}

export async function getProfileByUserId(userId: string) {
  const database = await getDb();
  const result = await database.query(
    "SELECT * FROM profiles WHERE user_id = $1",
    [userId]
  );
  return result.rows[0];
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
  }
) {
  const database = await getDb();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.displayName);
  }
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.location !== undefined) {
    updates.push(`location = $${paramIndex++}`);
    values.push(data.location);
  }
  if (data.website !== undefined) {
    updates.push(`website = $${paramIndex++}`);
    values.push(data.website);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await database.query(
    `UPDATE profiles
     SET ${updates.join(", ")}
     WHERE user_id = $${paramIndex}
     RETURNING *`,
    values
  );
  return result.rows[0];
}

// Posts
export async function createPost(authorId: string, content: string) {
  const database = await getDb();
  const id = crypto.randomUUID();
  const result = await database.query(
    `INSERT INTO posts (id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, authorId, content]
  );
  return result.rows[0];
}

export async function getAllPosts() {
  const database = await getDb();
  const result = await database.query(`
    SELECT
      p.*,
      pr.display_name as author_name
    FROM posts p
    JOIN profiles pr ON p.author_id = pr.user_id
    ORDER BY p.created_at DESC
  `);
  return result.rows;
}

export async function getPostsByUserId(userId: string) {
  const database = await getDb();
  const result = await database.query(
    `SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Message Threads
export async function createMessageThread(participantIds: string[]) {
  const database = await getDb();
  const threadId = crypto.randomUUID();

  // Create thread
  await database.query(
    `INSERT INTO message_threads (id) VALUES ($1)`,
    [threadId]
  );

  // Add participants
  for (const userId of participantIds) {
    await database.query(
      `INSERT INTO thread_participants (thread_id, user_id) VALUES ($1, $2)`,
      [threadId, userId]
    );
  }

  return threadId;
}

export async function getThreadsForUser(userId: string) {
  const database = await getDb();
  const result = await database.query(
    `
    SELECT
      mt.id,
      mt.updated_at,
      (
        SELECT m.content
        FROM messages m
        WHERE m.thread_id = mt.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT m.created_at
        FROM messages m
        WHERE m.thread_id = mt.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message_time,
      (
        SELECT pr.display_name
        FROM thread_participants tp
        JOIN profiles pr ON tp.user_id = pr.user_id
        WHERE tp.thread_id = mt.id AND tp.user_id != $1
        LIMIT 1
      ) as recipient_name,
      (
        SELECT pr.user_id
        FROM thread_participants tp
        JOIN profiles pr ON tp.user_id = pr.user_id
        WHERE tp.thread_id = mt.id AND tp.user_id != $1
        LIMIT 1
      ) as recipient_id
    FROM message_threads mt
    JOIN thread_participants tp ON mt.id = tp.thread_id
    WHERE tp.user_id = $1
    ORDER BY mt.updated_at DESC
  `,
    [userId]
  );
  return result.rows;
}

// Messages
export async function createMessage(
  threadId: string,
  senderId: string,
  content: string
) {
  const database = await getDb();
  const id = crypto.randomUUID();

  // Insert message
  const result = await database.query(
    `INSERT INTO messages (id, thread_id, sender_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, threadId, senderId, content]
  );

  // Update thread timestamp
  await database.query(
    `UPDATE message_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [threadId]
  );

  return result.rows[0];
}

export async function getMessagesByThreadId(threadId: string, currentUserId: string) {
  const database = await getDb();
  const result = await database.query(
    `
    SELECT
      m.*,
      pr.display_name as sender_name,
      CASE WHEN m.sender_id = $2 THEN true ELSE false END as is_current_user
    FROM messages m
    JOIN profiles pr ON m.sender_id = pr.user_id
    WHERE m.thread_id = $1
    ORDER BY m.created_at ASC
  `,
    [threadId, currentUserId]
  );
  return result.rows;
}

// Export getDb for direct database access in routes
export { getDb };
