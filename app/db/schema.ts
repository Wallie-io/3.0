/**
 * Drizzle ORM Database Schema
 * Defines all tables for Wallie 3.0
 */

import { pgTable, text, timestamp, boolean, integer, primaryKey, numeric } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique(),
  email: text('email').unique(),
  theme: text('theme').default('system'),
  createdAt: timestamp('created_at').defaultNow()
});

// WebAuthn Credentials table (passkeys)
export const credentials = pgTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  transports: text('transports'), // JSON string
  createdAt: timestamp('created_at').defaultNow()
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  location: text('location'),
  website: text('website'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Posts table
export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }),
  anonymousAuthor: text('anonymous_author'),
  replyToId: text('reply_to_id'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  synced: boolean('synced').default(false)
});

// Post likes table (many-to-many)
export const postLikes = pgTable('post_likes', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] })
}));

// Message threads table
export const messageThreads = pgTable('message_threads', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Thread participants table (many-to-many)
export const threadParticipants = pgTable('thread_participants', {
  threadId: text('thread_id').notNull().references(() => messageThreads.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.threadId, table.userId] })
}));

// Messages table
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => messageThreads.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  encrypted: boolean('encrypted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  synced: boolean('synced').default(false),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at')
});

// Typing indicators table
export const typingIndicators = pgTable('typing_indicators', {
  threadId: text('thread_id').notNull().references(() => messageThreads.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isTyping: boolean('is_typing').default(false),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.threadId, table.userId] })
}));

// User presence table
export const userPresence = pgTable('user_presence', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['online', 'offline', 'away'] }).default('offline'),
  lastSeen: timestamp('last_seen').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Login tokens table (for QR code login)
export const loginTokens = pgTable('login_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Images table (for message and post attachments)
export const images = pgTable('images', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalFilename: text('original_filename').notNull(),
  totalStorageMb: numeric('total_storage_mb', { precision: 10, scale: 2 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  r2BucketName: text('r2_bucket_name').notNull(),
  originalKey: text('original_key').notNull(),
  originalSizeBytes: integer('original_size_bytes').notNull(),
  thumbnailKey: text('thumbnail_key').notNull(),
  thumbnailSizeBytes: integer('thumbnail_size_bytes').notNull(),
  mediumKey: text('medium_key').notNull(),
  mediumSizeBytes: integer('medium_size_bytes').notNull(),
  largeKey: text('large_key').notNull(),
  largeSizeBytes: integer('large_size_bytes').notNull(),
  originalWidth: integer('original_width').notNull(),
  originalHeight: integer('original_height').notNull()
});

// Invite codes table (for referral system)
export const inviteCodes = pgTable('invite_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  generatedAt: timestamp('generated_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  usedBy: text('used_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at')
});

// User follows table (one-way following)
export const userFollows = pgTable('user_follows', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] })
}));

// User connections table (two-way connections)
export const userConnections = pgTable('user_connections', {
  id: text('id').primaryKey(),
  userId1: text('user_id_1').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId2: text('user_id_2').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'declined'] }).default('pending'),
  initiatorId: text('initiator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Referrals table (track who invited whom)
export const referrals = pgTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: text('referred_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inviteCode: text('invite_code').notNull().references(() => inviteCodes.code, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

// Health checks table
export const healthChecks = pgTable('health_checks', {
  id: text('id').primaryKey(),
  service: text('service').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  checkedAt: timestamp('checked_at').defaultNow()
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;

export type MessageThread = typeof messageThreads.$inferSelect;
export type NewMessageThread = typeof messageThreads.$inferInsert;

export type ThreadParticipant = typeof threadParticipants.$inferSelect;
export type NewThreadParticipant = typeof threadParticipants.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type NewTypingIndicator = typeof typingIndicators.$inferInsert;

export type UserPresence = typeof userPresence.$inferSelect;
export type NewUserPresence = typeof userPresence.$inferInsert;

export type LoginToken = typeof loginTokens.$inferSelect;
export type NewLoginToken = typeof loginTokens.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;

export type UserFollow = typeof userFollows.$inferSelect;
export type NewUserFollow = typeof userFollows.$inferInsert;

export type UserConnection = typeof userConnections.$inferSelect;
export type NewUserConnection = typeof userConnections.$inferInsert;

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

export type HealthCheck = typeof healthChecks.$inferSelect;
export type NewHealthCheck = typeof healthChecks.$inferInsert;
