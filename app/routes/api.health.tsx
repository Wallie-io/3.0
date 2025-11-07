import type { Route } from "./+types/api.health";
import { db } from "~/db/connection";
import { sql } from "drizzle-orm";

/**
 * Health check endpoint
 * Tests database connectivity by writing, reading, and deleting a test row
 */
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const testId = `health_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create health_checks table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        checked_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Write test row
    await db.execute(sql`
      INSERT INTO health_checks (id, checked_at)
      VALUES (${testId}, NOW())
    `);

    // Read test row to verify write succeeded
    const result = await db.execute(sql`
      SELECT id FROM health_checks WHERE id = ${testId}
    `);

    if (!result || (Array.isArray(result) && result.length === 0)) {
      throw new Error("Failed to read test row from database");
    }

    // Delete test row
    await db.execute(sql`
      DELETE FROM health_checks WHERE id = ${testId}
    `);

    // Clean up old health check rows (keep last 10)
    await db.execute(sql`
      DELETE FROM health_checks
      WHERE id NOT IN (
        SELECT id FROM health_checks
        ORDER BY checked_at DESC
        LIMIT 10
      )
    `);

    return new Response(
      JSON.stringify({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
