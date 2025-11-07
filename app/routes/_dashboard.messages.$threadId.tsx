import { useLoaderData, Link, useFetcher } from "react-router";
import type { Route } from "./+types/_dashboard.messages.$threadId";
import { requireUserId } from "~/lib/session.server";
import {
  getMessagesInThread,
  getThreadById,
  isThreadParticipant,
  sendMessage,
} from "~/db/services/messages";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import { useMessagePolling } from "~/hooks/use-message-polling";
import { useState, useEffect, useRef } from "react";
import { MessageContent } from "~/components/MessageContent";
import { insertImageReference } from "~/lib/message-parser";

/**
 * Server Loader: Get thread and messages
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const { threadId } = params;

  if (!threadId) {
    throw new Response("Thread ID is required", { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await isThreadParticipant(threadId, userId);
  if (!isParticipant) {
    throw new Response("Unauthorized", { status: 403 });
  }

  // Get thread details
  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Response("Thread not found", { status: 404 });
  }

  // Get the other participant (or self if messaging yourself)
  const otherParticipant = thread.participants.find(p => p.userId !== userId) || thread.participants[0];
  const isSelfThread = thread.participants.every(p => p.userId === userId);

  // Get messages (limit to 30 for initial load)
  const result = await getMessagesInThread(threadId, { limit: 30 });

  // Format messages for display
  const messages = result.data.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    timestamp: msg.createdAt ? dayjs(msg.createdAt).format("h:mm A") : "",
    createdAt: msg.createdAt?.toISOString() || "",
    isCurrentUser: msg.senderId === userId,
    senderName: msg.senderDisplayName || msg.senderUsername || "Unknown",
    senderAvatar: (msg.senderDisplayName || msg.senderUsername || "?")[0].toUpperCase(),
  }));

  return {
    userId,
    threadId,
    thread: {
      id: threadId,
      recipientName: isSelfThread
        ? `${otherParticipant?.displayName || otherParticipant?.username || "You"} (Note to self)`
        : otherParticipant?.displayName || otherParticipant?.username || "Unknown",
      recipientAvatar: (otherParticipant?.displayName || otherParticipant?.username || "?")[0].toUpperCase(),
      recipientId: otherParticipant?.userId || "",
      isSelfThread,
    },
    messages,
    pagination: {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
  };
}

/**
 * Server Action: Send a new message
 */
export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const { threadId } = params;

  if (!threadId) {
    return { error: "Thread ID is required" };
  }

  // Verify user is a participant
  const isParticipant = await isThreadParticipant(threadId, userId);
  if (!isParticipant) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const content = formData.get("content");
  const intent = formData.get("intent");

  if (intent === "send-message") {
    console.log(`[ACTION] Sending message in thread ${threadId} from user ${userId}`);

    if (typeof content !== "string" || content.trim().length === 0) {
      return { error: "Message cannot be empty" };
    }

    if (content.length > 5000) {
      return { error: "Message is too long (max 5000 characters)" };
    }

    // Send message
    console.log(`[ACTION] Calling sendMessage service...`);
    await sendMessage(threadId, userId, content.trim());
    console.log(`[ACTION] Message sent successfully`);

    // Return success (no redirect - using optimistic updates)
    return { success: true };
  }

  return null;
}

export function meta({ data }: Route.MetaArgs) {
  const recipientName = data?.thread?.recipientName || "Messages";
  return [
    { title: `${recipientName} - Messages - Wallie` },
    { name: "description", content: "End-to-end encrypted messaging" },
  ];
}

export default function Messages() {
  const { userId, thread, messages: initialMessages, pagination: initialPagination } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const loadMoreFetcher = useFetcher();
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for messages (with real-time updates)
  const [messages, setMessages] = useState(initialMessages);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollHeightRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);
  const lastMessageIdRef = useRef<string | null>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null
  );

  // Track optimistic message
  const [optimisticMessage, setOptimisticMessage] = useState<{
    id: string;
    content: string;
    timestamp: string;
  } | null>(null);

  // Track image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update messages when loader data changes (e.g., after navigation to different thread)
  useEffect(() => {
    setMessages(initialMessages);
    setPagination(initialPagination);
    isInitialMountRef.current = true;
    lastMessageIdRef.current = initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null;
  }, [initialMessages, initialPagination]);

  // Scroll to bottom on initial mount (after messages are rendered)
  useEffect(() => {
    if (isInitialMountRef.current && messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 0);
      isInitialMountRef.current = false;
    }
  }, [messages]);

  // Auto-scroll to bottom when NEW messages arrive at the end (not when loading older ones)
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Skip - handled by initial mount effect
      return;
    }

    // Check if a new message was added to the END of the list
    const currentLastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastMessageChanged = currentLastMessage && currentLastMessage.id !== lastMessageIdRef.current;

    // Scroll to bottom if:
    // 1. We have an optimistic message (user just sent a message)
    // 2. OR a new message appeared at the end of the list (received via polling)
    if (optimisticMessage || lastMessageChanged) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Update the last message ID
    if (currentLastMessage) {
      lastMessageIdRef.current = currentLastMessage.id;
    }
  }, [messages, optimisticMessage]);

  // Long polling for real-time messages
  useMessagePolling({
    threadId: thread.id,
    enabled: true,
    onMessage: (newMessage) => {
      // Check if this message matches the optimistic message
      if (optimisticMessage &&
          newMessage.content === optimisticMessage.content &&
          newMessage.senderId === userId) {
        // Clear optimistic message since we got the real one
        setOptimisticMessage(null);
      }

      // Add new message to the list if not already present
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;

        const formattedMessage = {
          id: newMessage.id,
          content: newMessage.content,
          senderId: newMessage.senderId,
          timestamp: newMessage.createdAt ? dayjs(newMessage.createdAt).format("h:mm A") : "",
          createdAt: newMessage.createdAt || "",
          isCurrentUser: newMessage.senderId === userId,
          senderName: newMessage.senderDisplayName || newMessage.senderUsername || "Unknown",
          senderAvatar: (newMessage.senderDisplayName || newMessage.senderUsername || "?")[0].toUpperCase(),
        };

        return [...prev, formattedMessage];
      });
    },
    onError: (err) => {
      console.error("Polling error:", err);
    },
  });

  // Handle scroll event for infinite loading
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if scrolled near the top (within 100px)
      if (container.scrollTop < 100 && pagination.hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pagination.hasMore, isLoadingMore]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!pagination.hasMore || isLoadingMore || !pagination.nextCursor) return;

    setIsLoadingMore(true);

    // Store current scroll position
    if (messagesContainerRef.current) {
      scrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }

    // Fetch older messages
    loadMoreFetcher.load(`/api/messages/load-more?threadId=${thread.id}&cursor=${encodeURIComponent(pagination.nextCursor)}`);
  };

  // Handle load more fetcher response
  useEffect(() => {
    if (loadMoreFetcher.data && loadMoreFetcher.state === "idle") {
      const data = loadMoreFetcher.data as {
        messages: typeof messages;
        pagination: typeof pagination;
      };

      if (data.messages && data.messages.length > 0) {
        // Prepend older messages, filtering out any duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));
          return [...newMessages, ...prev];
        });
        setPagination(data.pagination);

        // Restore scroll position after new messages are added
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - scrollHeightRef.current;
            messagesContainerRef.current.scrollTop = scrollDiff;
          }
          setIsLoadingMore(false);
        }, 0);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [loadMoreFetcher.data, loadMoreFetcher.state]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or AVIF image.');
      return;
    }

    // Validate file size (18MB)
    if (file.size > 18 * 1024 * 1024) {
      alert('File size exceeds 18MB limit.');
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image
      const formData = new FormData();
      formData.append('image', file);
      formData.append('context', 'message'); // Indicate this is for a message (private bucket)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Insert image reference into message input
      if (inputRef.current) {
        const currentValue = inputRef.current.value;
        const cursorPosition = inputRef.current.selectionStart || currentValue.length;
        const newValue = insertImageReference(currentValue, data.imageId, cursorPosition);
        inputRef.current.value = newValue;
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;

    if (!content || content.trim().length === 0) return;

    // Create optimistic message
    setOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      content: content.trim(),
      timestamp: dayjs().format("h:mm A"),
    });

    // Submit via fetcher
    fetcher.submit(formData, { method: "post" });

    // Clear input immediately and keep focus
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full">
      {/* Thread header */}
      <div className="bg-wallie-darker rounded-t-2xl shadow-wallie-lg border border-white/10 p-4 flex items-center gap-4 shrink-0">
        <Link
          to="/messages"
          className="p-2 hover:bg-wallie-charcoal/50 rounded-lg transition-colors text-wallie-text-secondary hover:text-wallie-text-primary"
        >
          ← Back
        </Link>

        <div className="w-10 h-10 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold shadow-wallie-glow-accent">
          {thread.recipientAvatar}
        </div>

        <div className="flex-1">
          <h2 className="font-semibold text-wallie-text-primary">{thread.recipientName}</h2>
          <p className="text-sm text-red-400 flex items-center gap-1"><span className="text-[10px] leading-none">❌</span> Not encrypted</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-wallie-darker border-x border-white/10 p-6 space-y-4"
      >
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 text-wallie-text-tertiary text-sm">
              <div className="w-4 h-4 border-2 border-wallie-text-tertiary/30 border-t-wallie-text-tertiary rounded-full animate-spin" />
              <span>Loading older messages...</span>
            </div>
          </div>
        )}

        {/* Reached beginning indicator */}
        {!pagination.hasMore && messages.length > 0 && (
          <div className="flex justify-center py-3">
            <div className="px-4 py-2 rounded-full bg-wallie-charcoal/30 border border-white/5">
              <p className="text-xs text-wallie-text-tertiary">
                Beginning of conversation
              </p>
            </div>
          </div>
        )}

        {messages.length === 0 && !optimisticMessage ? (
          <div className="text-center py-12">
            <p className="text-wallie-text-secondary">No messages yet</p>
            <p className="text-sm text-wallie-text-tertiary mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-md px-4 py-3 rounded-2xl",
                    message.isCurrentUser
                      ? "bg-wallie-accent text-wallie-dark rounded-br-sm"
                      : "bg-wallie-charcoal/50 text-wallie-text-primary rounded-bl-sm"
                  )}
                >
                  <MessageContent
                    content={message.content}
                    isCurrentUser={message.isCurrentUser}
                  />
                  <p
                    className={cn(
                      "text-xs mt-1 select-none",
                      message.isCurrentUser ? "text-wallie-dark/70" : "text-wallie-text-tertiary"
                    )}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {/* Optimistic message with loading spinner - only show if real message hasn't arrived yet */}
            {optimisticMessage && !messages.some(m => m.content === optimisticMessage.content && m.isCurrentUser) && (
              <div className="flex justify-end">
                <div className="max-w-md px-4 py-3 rounded-2xl bg-wallie-accent/70 text-wallie-dark rounded-br-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <MessageContent
                        content={optimisticMessage.content}
                        isCurrentUser={true}
                      />
                    </div>
                    <div className="w-4 h-4 mt-0.5 border-2 border-wallie-dark/30 border-t-wallie-dark rounded-full animate-spin" />
                  </div>
                  <p className="text-xs mt-1 text-wallie-dark/70 select-none">
                    {optimisticMessage.timestamp}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-wallie-darker rounded-b-2xl shadow-wallie-lg border border-white/10 p-4 shrink-0">
        {fetcher.data?.error && (
          <div className="mb-3 p-2 rounded-lg bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
            {fetcher.data.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input type="hidden" name="intent" value="send-message" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className={cn(
              "px-4 py-3 rounded-lg font-medium",
              "bg-wallie-charcoal/50 border border-white/10 text-wallie-text-secondary",
              "hover:bg-wallie-charcoal/70 hover:text-wallie-accent",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
              "transition-colors duration-200",
              uploadingImage && "opacity-50 cursor-not-allowed"
            )}
            title="Upload image"
          >
            {uploadingImage ? (
              <div className="w-5 h-5 border-2 border-wallie-accent/30 border-t-wallie-accent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </button>

          <input
            ref={inputRef}
            type="text"
            name="content"
            placeholder="Type a message..."
            autoComplete="off"
            autoFocus
            className={cn(
              "flex-1 px-4 py-3 rounded-lg",
              "bg-wallie-charcoal/50 border border-white/10",
              "text-wallie-text-primary placeholder:text-wallie-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
            )}
          />

          <button
            type="submit"
            disabled={uploadingImage}
            className={cn(
              "px-6 py-3 rounded-lg font-medium",
              "bg-wallie-accent text-wallie-dark",
              "hover:bg-wallie-accent-dim",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
              "transition-colors duration-200",
              uploadingImage && "opacity-50 cursor-not-allowed"
            )}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
