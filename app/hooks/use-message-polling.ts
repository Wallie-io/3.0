/**
 * Client-side long polling hook for real-time messages
 * Uses Postgres LISTEN/NOTIFY via the /api/messages/poll endpoint
 */

import { useEffect, useRef, useState } from "react";

interface UseMessagePollingOptions {
  threadId?: string;
  enabled?: boolean;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

interface PollingState {
  isActive: boolean;
  error: string | null;
}

export function useMessagePolling(options: UseMessagePollingOptions = {}) {
  const {
    threadId,
    enabled = true,
    onMessage,
    onError,
  } = options;

  const [state, setState] = useState<PollingState>({
    isActive: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    startPolling();

    return () => {
      stopPolling();
    };
  }, [threadId, enabled]);

  const startPolling = async () => {
    if (isPollingRef.current) {
      return; // Already polling
    }

    isPollingRef.current = true;
    setState(prev => ({ ...prev, isActive: true, error: null }));

    await poll();
  };

  const stopPolling = () => {
    isPollingRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isActive: false }));
  };

  const poll = async () => {
    if (!isPollingRef.current) {
      return;
    }

    // Create abort controller for this poll request
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams();
      if (threadId) {
        params.set("threadId", threadId);
      }

      const url = `/api/messages/poll?${params.toString()}`;

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 204) {
        // Timeout, no new messages - immediately reconnect
        setState(prev => ({ ...prev, error: null }));

        if (isPollingRef.current) {
          poll();
        }

        return;
      }

      if (response.ok) {
        // New message received
        setState(prev => ({ ...prev, error: null }));

        const data = await response.json();

        if (data.message && onMessage) {
          onMessage(data.message);
        }

        // Immediately reconnect for next message
        if (isPollingRef.current) {
          poll();
        }

        return;
      }

      // Unexpected status code
      throw new Error(`Unexpected response: ${response.status}`);

    } catch (error: any) {
      if (error.name === "AbortError") {
        // Request was aborted (component unmounted or polling stopped)
        return;
      }

      console.error("Long polling error:", error);

      setState(prev => ({
        ...prev,
        error: error.message || "Connection error",
      }));

      if (onError) {
        onError(error);
      }

      // Retry after 2 seconds on error
      retryTimeoutRef.current = setTimeout(() => {
        if (isPollingRef.current) {
          poll();
        }
      }, 2000);
    }
  };

  return {
    isActive: state.isActive,
    error: state.error,
    restart: startPolling,
  };
}
