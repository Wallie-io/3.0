/**
 * Long Polling API for Real-Time Messages
 *
 * Uses Postgres LISTEN/NOTIFY for real-time push notifications.
 * Multiple connections per user are allowed (one per tab/window).
 */

import { data } from "react-router";
import type { Route } from "./+types/api.messages.poll";
import { requireUserId } from "~/lib/session.server";
import postgres from "postgres";
import { createHash } from "crypto";

// Poll timeout (60 seconds)
const POLL_TIMEOUT_MS = 60000;

/**
 * Create a short channel name for Postgres NOTIFY/LISTEN
 * Must match the function in messages.ts
 */
function getChannelName(userId: string, threadId?: string): string {
  const input = threadId ? `${userId}_${threadId}` : userId;
  const hash = createHash('md5').update(input).digest('hex').substring(0, 16);

  if (threadId) {
    return `wallie_msg_${hash}`;
  }
  return `wallie_usr_${hash}`;
}

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Long polling endpoint using Postgres LISTEN/NOTIFY
 * GET /api/messages/poll?threadId=xxx
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  // Parse query parameters
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId") || undefined;

  console.log(`[POLL] Starting long poll for user ${userId}${threadId ? `, thread ${threadId}` : ''}`);

  // Create a dedicated postgres connection for LISTEN/NOTIFY
  const sql = postgres(DATABASE_URL as string, {
    max: 1, // Single connection
    idle_timeout: 1, // Close quickly after use
  });

  try {
    // Listen for new messages
    const notification = await waitForNotification(sql, userId, threadId, POLL_TIMEOUT_MS);

    // Close connection
    await sql.end();

    if (notification) {
      // New message notification received
      console.log(`[POLL] Notification received for user ${userId}:`, notification);
      return data(
        {
          message: notification.message,
          threadId: notification.threadId,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Timeout reached, no new messages
    console.log(`[POLL] Timeout reached for user ${userId}, no new messages`);
    return new Response(null, { status: 204 });

  } catch (error) {
    console.error("[POLL] Long polling error:", error);

    // Close connection
    try {
      await sql.end();
    } catch (closeError) {
      console.error("[POLL] Failed to close connection:", closeError);
    }

    throw error;
  }
}

/**
 * Wait for Postgres NOTIFY event
 */
async function waitForNotification(
  sql: postgres.Sql,
  userId: string,
  threadId: string | undefined,
  timeoutMs: number
): Promise<{ message: any; threadId: string } | null> {
  return new Promise(async (resolve) => {
    let timeoutId: NodeJS.Timeout;
    let notificationReceived = false;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!notificationReceived) {
        resolve(null);
      }
    }, timeoutMs);

    // Generate short channel name
    const channel = getChannelName(userId, threadId);

    console.log(`[POLL] Listening on channel: ${channel}`);

    // Set up notification listener
    await sql.listen(channel, (payload) => {
      if (notificationReceived) return;

      console.log(`[POLL] Received notification on channel ${channel}:`, payload);
      notificationReceived = true;
      clearTimeout(timeoutId);

      try {
        const data = JSON.parse(payload);
        resolve(data);
      } catch (error) {
        console.error("[POLL] Failed to parse notification payload:", error);
        resolve(null);
      }
    });
  });
}
