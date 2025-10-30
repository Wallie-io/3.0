/**
 * Database initialization hook
 * Call this in the root component to ensure database is ready
 */

import { useEffect, useState } from "react";
import { initializeDatabase } from "./db.client";

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDatabase();
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize database:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
