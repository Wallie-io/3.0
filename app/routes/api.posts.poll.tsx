/**
 * Long Polling API for Real-Time Posts
 *
 * Uses Postgres LISTEN/NOTIFY for real-time push notifications.
 * Public endpoint - no authentication required.
 */

import type { Route } from "./+types/api.posts.poll";
import postgres from "postgres";

// Poll timeout (60 seconds)
const POLL_TIMEOUT_MS = 60000;

// Channel name for post notifications (matches the trigger in migration)
const POSTS_CHANNEL = 'posts_channel';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Long polling endpoint using Postgres LISTEN/NOTIFY
 * GET /api/posts/poll
 * Returns 200 when a new post is created, 204 on timeout
 */
export async function loader({ request }: Route.LoaderArgs) {
  console.log(`[POLL] Starting long poll for new posts`);

  // Create a dedicated postgres connection for LISTEN/NOTIFY
  const sql = postgres(DATABASE_URL as string, {
    max: 1, // Single connection
    idle_timeout: 1, // Close quickly after use
  });

  try {
    // Listen for new posts
    const hasNewPost = await waitForNotification(sql, POLL_TIMEOUT_MS);

    // Close connection
    await sql.end();

    if (hasNewPost) {
      // New post notification received
      console.log(`[POLL] New post notification received`);
      return new Response(
        JSON.stringify({ newPost: true, timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Timeout reached, no new posts
    console.log(`[POLL] Timeout reached, no new posts`);
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
  timeoutMs: number
): Promise<boolean> {
  return new Promise(async (resolve) => {
    let timeoutId: NodeJS.Timeout;
    let notificationReceived = false;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!notificationReceived) {
        resolve(false);
      }
    }, timeoutMs);

    console.log(`[POLL] Listening on channel: ${POSTS_CHANNEL}`);

    // Set up notification listener
    await sql.listen(POSTS_CHANNEL, () => {
      if (notificationReceived) return;

      console.log(`[POLL] Received notification on channel ${POSTS_CHANNEL}`);
      notificationReceived = true;
      clearTimeout(timeoutId);
      resolve(true);
    });
  });
}
