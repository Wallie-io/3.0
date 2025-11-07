/**
 * Messages Service
 * Handles all message and thread-related database operations
 */

import { db } from '../connection';
import { messages, messageThreads, threadParticipants, users, profiles } from '../schema';
import type { Message, NewMessage, MessageThread, NewMessageThread, NewThreadParticipant } from '../schema';
import { eq, and, desc, sql, or, inArray, lt, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

/**
 * Create a short channel name for Postgres NOTIFY/LISTEN
 * Postgres has a 63-character limit on identifiers
 */
function getChannelName(userId: string, threadId?: string): string {
  // Use MD5 hash to create shorter, unique channel names
  const input = threadId ? `${userId}_${threadId}` : userId;
  const hash = createHash('md5').update(input).digest('hex').substring(0, 16);

  if (threadId) {
    return `wallie_msg_${hash}`; // wallie_msg_ + 16 chars = 27 chars total
  }
  return `wallie_usr_${hash}`; // wallie_usr_ + 16 chars = 27 chars total
}

// ============================================================================
// Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================================================
// Thread Operations
// ============================================================================

/**
 * Get or create a thread between two users
 */
export async function getOrCreateThread(userId1: string, userId2: string): Promise<string> {
  // First, check if a thread already exists between these two users
  const existingThread = await db
    .select({ id: messageThreads.id })
    .from(messageThreads)
    .innerJoin(
      threadParticipants,
      eq(messageThreads.id, threadParticipants.threadId)
    )
    .where(eq(threadParticipants.userId, userId1))
    .then(async (threads) => {
      // For each thread, check if userId2 is also a participant
      for (const thread of threads) {
        const participants = await db
          .select({ userId: threadParticipants.userId })
          .from(threadParticipants)
          .where(eq(threadParticipants.threadId, thread.id));

        const participantIds = participants.map(p => p.userId);
        if (participantIds.length === 2 &&
            participantIds.includes(userId1) &&
            participantIds.includes(userId2)) {
          return thread.id;
        }
      }
      return null;
    });

  if (existingThread) {
    return existingThread;
  }

  // Create new thread
  const threadId = nanoid();
  await db.insert(messageThreads).values({
    id: threadId,
  });

  // Add participants (handle self-threads by only adding user once)
  if (userId1 === userId2) {
    // Self-thread: only add user once
    await db.insert(threadParticipants).values({
      threadId,
      userId: userId1
    });
  } else {
    // Normal thread: add both users
    await db.insert(threadParticipants).values([
      { threadId, userId: userId1 },
      { threadId, userId: userId2 },
    ]);
  }

  return threadId;
}

/**
 * Get all threads for a user with last message info (paginated)
 */
export async function getThreadsForUser(
  userId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<PaginatedResponse<{
  id: string;
  recipient_id: string | null;
  recipient_name: string;
  recipient_avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  updated_at: string;
}>> {
  const limit = options.limit || 15;

  // Build where conditions
  const whereConditions = options.cursor
    ? and(
        eq(threadParticipants.userId, userId),
        lt(messageThreads.updatedAt, new Date(options.cursor))
      )
    : eq(threadParticipants.userId, userId);

  // Get user's threads with pagination
  const threadsResult = await db
    .select({
      threadId: messageThreads.id,
      updatedAt: messageThreads.updatedAt,
    })
    .from(messageThreads)
    .innerJoin(
      threadParticipants,
      eq(messageThreads.id, threadParticipants.threadId)
    )
    .where(whereConditions)
    .orderBy(desc(messageThreads.updatedAt))
    .limit(limit + 1); // Get one extra to check if there are more
  const hasMore = threadsResult.length > limit;
  const threads = hasMore ? threadsResult.slice(0, limit) : threadsResult;

  const threadIds = threads.map(t => t.threadId);
  if (threadIds.length === 0) {
    return {
      data: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  // Get all participants for these threads
  const allParticipants = await db
    .select({
      threadId: threadParticipants.threadId,
      userId: threadParticipants.userId,
    })
    .from(threadParticipants)
    .where(inArray(threadParticipants.threadId, threadIds));

  // Get the other participant for each thread (or current user if self-thread)
  const otherParticipants = threadIds.map(threadId => {
    const threadParticipants = allParticipants.filter(p => p.threadId === threadId);
    const otherUser = threadParticipants.find(p => p.userId !== userId);
    // If no other user found, it's a self-thread, use current user
    return {
      threadId,
      userId: otherUser?.userId || userId
    };
  });

  // Get user details for participants (including current user for self-threads)
  const participantUserIds = [...new Set(otherParticipants.map(p => p.userId))];
  const userDetails = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(inArray(users.id, participantUserIds));

  // Get last message for each thread
  const lastMessages = await Promise.all(
    threadIds.map(async (threadId) => {
      const lastMsg = await db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
        })
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      return lastMsg[0] || null;
    })
  );

  // Combine everything
  const data = threads.map((thread) => {
    const otherParticipant = otherParticipants.find(p => p.threadId === thread.threadId);
    const userDetail = userDetails.find(u => u.id === otherParticipant?.userId);
    const lastMessage = lastMessages.find(m => m !== null);
    const isSelfThread = otherParticipant?.userId === userId;

    return {
      id: thread.threadId,
      recipient_id: otherParticipant?.userId || null,
      recipient_name: isSelfThread
        ? `${userDetail?.displayName || userDetail?.username || 'You'} (Note to self)`
        : userDetail?.displayName || userDetail?.username || 'Unknown',
      recipient_avatar_url: userDetail?.avatarUrl || null,
      last_message: lastMessage?.content || null,
      last_message_time: lastMessage?.createdAt ? lastMessage.createdAt.toISOString() : null,
      updated_at: thread.updatedAt?.toISOString() || new Date().toISOString(),
    };
  });

  const nextCursor = hasMore && threads.length > 0
    ? threads[threads.length - 1].updatedAt?.toISOString() || null
    : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Get thread details by ID
 */
export async function getThreadById(threadId: string) {
  const thread = await db
    .select()
    .from(messageThreads)
    .where(eq(messageThreads.id, threadId))
    .limit(1);

  if (thread.length === 0) {
    return null;
  }

  // Get participants
  const participants = await db
    .select({
      userId: threadParticipants.userId,
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(threadParticipants)
    .innerJoin(users, eq(threadParticipants.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(threadParticipants.threadId, threadId));

  return {
    ...thread[0],
    participants,
  };
}

/**
 * Verify user is a participant in a thread
 */
export async function isThreadParticipant(threadId: string, userId: string): Promise<boolean> {
  const participant = await db
    .select()
    .from(threadParticipants)
    .where(
      and(
        eq(threadParticipants.threadId, threadId),
        eq(threadParticipants.userId, userId)
      )
    )
    .limit(1);

  return participant.length > 0;
}

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Send a message in a thread
 */
export async function sendMessage(
  threadId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const messageId = nanoid();

  const [message] = await db
    .insert(messages)
    .values({
      id: messageId,
      threadId,
      senderId,
      content,
      encrypted: false,
      synced: true,
    })
    .returning();

  // Update thread's updatedAt
  await db
    .update(messageThreads)
    .set({ updatedAt: new Date() })
    .where(eq(messageThreads.id, threadId));

  // Get thread participants to notify
  const participants = await db
    .select({ userId: threadParticipants.userId })
    .from(threadParticipants)
    .where(eq(threadParticipants.threadId, threadId));

  // Get sender info for the notification
  const senderInfo = await db
    .select({
      username: users.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, senderId))
    .limit(1);

  const sender = senderInfo[0];

  // Notify all participants via Postgres NOTIFY
  const payload = {
    message: {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      content: message.content,
      encrypted: message.encrypted,
      createdAt: message.createdAt?.toISOString(),
      senderUsername: sender?.username,
      senderDisplayName: sender?.displayName,
      senderAvatarUrl: sender?.avatarUrl,
    },
    threadId: threadId,
  };

  // Notify each participant (including sender for self-threads)
  for (const participant of participants) {
    // Notify on user-specific channel
    const userChannel = getChannelName(participant.userId);
    console.log(`[MSG] Sending NOTIFY to user channel: ${userChannel} (user: ${participant.userId})`);
    await db.execute(
      sql`SELECT pg_notify(${userChannel}, ${JSON.stringify(payload)})`
    );

    // Also notify on thread-specific channel
    const threadChannel = getChannelName(participant.userId, threadId);
    console.log(`[MSG] Sending NOTIFY to thread channel: ${threadChannel} (user: ${participant.userId})`);
    await db.execute(
      sql`SELECT pg_notify(${threadChannel}, ${JSON.stringify(payload)})`
    );
  }

  console.log(`[MSG] Message sent and notifications dispatched for thread ${threadId}`);

  return message;
}

/**
 * Get all messages in a thread (paginated)
 */
export async function getMessagesInThread(
  threadId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<PaginatedResponse<{
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  encrypted: boolean | null;
  createdAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  senderUsername: string | null;
  senderDisplayName: string | null;
  senderAvatarUrl: string | null;
}>> {
  const limit = options.limit || 15;

  // Build where conditions
  const whereConditions = options.cursor
    ? and(
        eq(messages.threadId, threadId),
        sql`${messages.deletedAt} IS NULL`,
        lt(messages.createdAt, new Date(options.cursor))
      )
    : and(
        eq(messages.threadId, threadId),
        sql`${messages.deletedAt} IS NULL`
      );

  const result = await db
    .select({
      id: messages.id,
      threadId: messages.threadId,
      senderId: messages.senderId,
      content: messages.content,
      encrypted: messages.encrypted,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
      deletedAt: messages.deletedAt,
      senderUsername: users.username,
      senderDisplayName: profiles.displayName,
      senderAvatarUrl: profiles.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(whereConditions)
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1); // Get one extra to check if there are more
  const hasMore = result.length > limit;
  const msgs = hasMore ? result.slice(0, limit) : result;

  const nextCursor = hasMore && msgs.length > 0
    ? msgs[msgs.length - 1].createdAt?.toISOString() || null
    : null;

  return {
    data: msgs.reverse(), // Oldest first for display
    nextCursor,
    hasMore,
  };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(threadId: string, userId: string): Promise<void> {
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.threadId, threadId),
        sql`${messages.senderId} != ${userId}`,
        sql`${messages.readAt} IS NULL`
      )
    );
}

/**
 * Delete a message (only if user is the sender)
 */
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const [updated] = await db
    .update(messages)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
    })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.senderId, userId) // Security: Only sender can delete
      )
    )
    .returning();

  return !!updated; // Returns true if deleted, false if not found or not authorized
}

/**
 * Edit a message (only if user is the sender)
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<Message | null> {
  const [updated] = await db
    .update(messages)
    .set({
      content: newContent,
      editedAt: new Date(),
    })
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.senderId, userId) // Security: Only sender can edit
      )
    )
    .returning();

  return updated || null; // Returns null if not found or not authorized
}
