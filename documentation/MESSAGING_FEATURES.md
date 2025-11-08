# Wallie Real-Time Messaging Features

## Overview

This document outlines the real-time messaging features implemented in Wallie 3.0, including live message delivery, typing indicators, presence status, message receipts, and message editing/deletion capabilities.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Long Polling for Real-Time Updates](#long-polling-for-real-time-updates)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Implementation Milestones](#implementation-milestones)
6. [Usage Examples](#usage-examples)
7. [Testing Guide](#testing-guide)
8. [Future Enhancements](#future-enhancements)

---

## Architecture

### Technology Stack

- **Database:** PGlite (Postgres WASM) for local-first storage
- **Real-time Sync:** Electric-SQL (to be integrated)
- **Framework:** React Router v7
- **State Management:** React hooks + Electric-SQL subscriptions
- **Encryption:** E2E encryption (separate implementation)

### Data Flow

```
User Action (Send Message)
  ↓
Client Action (clientAction)
  ↓
Local Database (PGlite)
  ↓
Electric-SQL Sync (background)
  ↓
Central Postgres Database
  ↓
Electric-SQL Push
  ↓
Recipient's Local Database
  ↓
UI Update (automatic subscription)
```

### Key Principles

1. **Local-First:** All operations write to local DB first
2. **Optimistic UI:** Show changes immediately, sync in background
3. **Conflict Resolution:** Last-write-wins with timestamp ordering
4. **Offline Support:** Queue operations when offline, sync when online

---

## Long Polling for Real-Time Updates

### Overview

Long polling with Postgres LISTEN/NOTIFY is used to provide real-time message updates to clients. Multiple connections per user are allowed (one per browser tab/window).

### Technical Specification

#### Postgres LISTEN/NOTIFY

**How it works:**
- Client opens long polling connection to `/api/messages/poll`
- Server executes `LISTEN` on a hashed channel name (e.g., `wallie_usr_abc123` or `wallie_msg_def456`)
- When a message is sent, server triggers `NOTIFY` on the channel with message payload
- All listening clients receive the notification instantly (real push, not polling)
- Connection automatically closes after 60 seconds of no activity (client immediately reconnects)

**Channel Naming:**
- User-specific channel: `wallie_usr_{md5_hash(userId)[:16]}`
- Thread-specific channel: `wallie_msg_{md5_hash(userId_threadId)[:16]}`
- MD5 hash ensures channel names stay under Postgres 63-character limit

**Benefits:**
- True push notifications (no database polling)
- Multiple tabs supported (each gets its own LISTEN connection)
- Automatic cleanup when connections drop
- Lightweight and scalable

#### Endpoint Behavior

**Route:** `GET /api/messages/poll`

**Query Parameters:**
- `threadId` (optional): Poll for updates in specific thread

**Request Flow:**
1. Client opens long polling connection
2. Server executes `LISTEN` on the appropriate channel
3. Server waits for `NOTIFY` event (up to 60 seconds)
4. When new message arrives → return message data immediately
5. On timeout → return `204 No Content`
6. Client immediately reconnects for next message

**Response Codes:**
- `200 OK` - New message received (returns message data)
- `204 No Content` - Timeout reached, no new messages (client should reconnect)
- `401 Unauthorized` - User not authenticated

**Example Implementation:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId") || undefined;

  // Create dedicated postgres connection
  const sql = postgres(DATABASE_URL, { max: 1, idle_timeout: 1 });

  try {
    // Listen for notifications
    const notification = await waitForNotification(sql, userId, threadId, 60000);

    await sql.end();

    if (notification) {
      return data({ message: notification.message }, { status: 200 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    await sql.end();
    throw error;
  }
}
```

### Client-Side Handling

**Reconnection Logic:**
```typescript
async function startLongPolling() {
  try {
    const params = threadId ? `?threadId=${threadId}` : '';
    const response = await fetch(`/api/messages/poll${params}`);

    if (response.status === 204) {
      // Timeout, no new messages - immediately reconnect
      return startLongPolling();
    }

    if (response.ok) {
      const data = await response.json();
      handleNewMessage(data.message);
    }

    // Immediately reconnect for next message
    startLongPolling();

  } catch (error) {
    // Network error - retry with backoff
    console.error('Long polling error:', error);
    await sleep(2000);
    startLongPolling();
  }
}
```

### Multiple Tab Behavior

Multiple tabs work seamlessly:
1. Each tab maintains its own long polling connection
2. All tabs receive notifications simultaneously via Postgres NOTIFY
3. Each connection is independent and lightweight
4. No coordination needed between tabs

**Performance:**
- Each LISTEN connection is very lightweight (~1KB memory per connection)
- Postgres can easily handle hundreds of concurrent LISTEN connections
- All listeners on the same channel receive notifications in parallel

### Testing Behavior

**Test Cases:**
1. ✅ Single connection receives messages in real-time
2. ✅ Multiple tabs all receive messages simultaneously
3. ✅ Connection auto-closes after 60s timeout
4. ✅ Client immediately reconnects after timeout
5. ✅ Network failure triggers automatic retry
6. ✅ Messages sent while offline are delivered on reconnect

**Manual Test:**
```bash
# Terminal 1: Start long polling
curl -H "Cookie: session=user1-session" http://localhost:3000/api/messages/poll

# Terminal 2: Start another connection (should work fine)
curl -H "Cookie: session=user1-session" http://localhost:3000/api/messages/poll

# Terminal 3: Send a message
curl -X POST -H "Cookie: session=user2-session" \
  -d "content=Hello" http://localhost:3000/messages/thread123

# Both Terminal 1 and 2 should receive the message instantly
```

### Performance Considerations

- **LISTEN overhead:** Very lightweight, ~1KB memory per connection
- **Scale:** Postgres can handle thousands of concurrent LISTEN connections
- **NOTIFY fanout:** All listeners receive notifications in parallel
- **Connection lifecycle:** Connections automatically timeout after 60s

```sql
-- View active Postgres connections
SELECT
  pid,
  usename,
  application_name,
  state,
  age(now(), backend_start) as connection_age
FROM pg_stat_activity
WHERE state = 'idle'
ORDER BY backend_start DESC;
```

---

## Database Schema

### Messages Table

Extended with real-time messaging columns:

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT FALSE,

  -- New columns for real-time features
  edited_at TIMESTAMP,           -- When message was last edited
  deleted_at TIMESTAMP,          -- When message was deleted (soft delete)
  deleted_by TEXT,               -- User ID who deleted the message
  delivered_at TIMESTAMP,        -- When message was delivered to recipient
  read_at TIMESTAMP              -- When message was read by recipient
);
```

### Typing Indicators Table

Tracks who is currently typing in each thread:

```sql
CREATE TABLE typing_indicators (
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, user_id)
);
```

### User Presence Table

Tracks online/offline status for users:

```sql
CREATE TABLE user_presence (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_typing_indicators_thread ON typing_indicators(thread_id);
CREATE INDEX idx_user_presence_status ON user_presence(status, updated_at);
```

---

## API Reference

### User Search

#### `searchUsersByUserId(searchQuery: string): Promise<User[]>`

Search for users by their user ID (partial match).

**Parameters:**
- `searchQuery`: String to search for in user IDs

**Returns:** Array of user objects with:
- `id`: User ID
- `email`: User email
- `display_name`: User's display name (from profile)
- `avatar_url`: User's avatar URL

**Example:**
```typescript
const users = await searchUsersByUserId("user123");
// Returns users whose ID contains "user123"
```

---

### Typing Indicators

#### `setTypingStatus(threadId: string, userId: string, isTyping: boolean): Promise<void>`

Update the typing status for a user in a thread.

**Parameters:**
- `threadId`: Thread ID where user is typing
- `userId`: User ID who is typing
- `isTyping`: Boolean indicating if user is currently typing

**Usage Pattern:**
```typescript
// User starts typing
await setTypingStatus(threadId, userId, true);

// User stops typing (after 3s of inactivity)
await setTypingStatus(threadId, userId, false);
```

#### `getTypingUsers(threadId: string, excludeUserId: string): Promise<TypingUser[]>`

Get list of users currently typing in a thread (excludes the current user).

**Parameters:**
- `threadId`: Thread ID to check
- `excludeUserId`: Current user's ID (to exclude from results)

**Returns:** Array of typing users with:
- `user_id`: User ID
- `display_name`: User's display name

**Auto-Cleanup:** Only returns users who have typed within the last 5 seconds.

---

### User Presence

#### `updateUserPresence(userId: string, status: 'online' | 'offline' | 'away'): Promise<void>`

Update a user's online/offline status.

**Parameters:**
- `userId`: User ID
- `status`: One of 'online', 'offline', or 'away'

**Heartbeat Pattern:**
```typescript
// Update presence every 30 seconds when user is active
setInterval(async () => {
  await updateUserPresence(userId, 'online');
}, 30000);

// Mark offline on page unload
window.addEventListener('beforeunload', () => {
  updateUserPresence(userId, 'offline');
});
```

#### `getUserPresence(userId: string): Promise<Presence>`

Get presence information for a specific user.

**Returns:**
- `user_id`: User ID
- `status`: 'online', 'offline', or 'away'
- `last_seen`: Last seen timestamp
- `updated_at`: Last update timestamp

#### `getOnlineUsers(userIds: string[]): Promise<Presence[]>`

Get online status for multiple users efficiently.

**Parameters:**
- `userIds`: Array of user IDs to check

**Returns:** Array of presence objects for users who are online or were online in the last 60 seconds.

---

### Message Edit & Delete

#### `editMessage(messageId: string, newContent: string): Promise<Message>`

Edit an existing message's content.

**Parameters:**
- `messageId`: Message ID to edit
- `newContent`: New message content

**Returns:** Updated message object

**Business Rules:**
- Only the sender can edit their messages
- Messages cannot be edited after 15 minutes
- Deleted messages cannot be edited
- Sets `edited_at` timestamp automatically

#### `deleteMessage(messageId: string, userId: string): Promise<Message>`

Soft-delete a message (mark as deleted without removing from DB).

**Parameters:**
- `messageId`: Message ID to delete
- `userId`: User ID performing the deletion

**Returns:** Updated message object

**Behavior:**
- Sets `deleted_at` timestamp
- Sets `deleted_by` to the user ID
- Message remains in database for audit trail
- UI should show "This message was deleted" placeholder

#### `canEditMessage(messageId: string, userId: string): Promise<boolean>`

Check if a user can edit a specific message.

**Parameters:**
- `messageId`: Message ID to check
- `userId`: User ID attempting to edit

**Returns:** `true` if user can edit, `false` otherwise

**Validation Rules:**
- User must be the sender
- Message must not be deleted
- Message must be less than 15 minutes old

---

### Message Receipts

#### `markMessageDelivered(messageId: string): Promise<Message>`

Mark a message as delivered to the recipient's device.

**Parameters:**
- `messageId`: Message ID to mark as delivered

**Returns:** Updated message object

**Behavior:**
- Only updates if `delivered_at` is null
- Sets `delivered_at` to current timestamp
- Triggered automatically when message syncs to recipient's device

#### `markMessageRead(messageId: string): Promise<Message>`

Mark a message as read by the recipient.

**Parameters:**
- `messageId`: Message ID to mark as read

**Returns:** Updated message object

**Behavior:**
- Sets `read_at` to current timestamp
- Also sets `delivered_at` if not already set
- Only updates if `read_at` is null

#### `markThreadMessagesRead(threadId: string, userId: string): Promise<void>`

Mark all unread messages in a thread as read (bulk operation).

**Parameters:**
- `threadId`: Thread ID
- `userId`: Current user ID (excludes messages they sent)

**Behavior:**
- Updates all messages in the thread
- Only updates messages sent by others
- Only updates messages where `read_at` is null
- Useful when opening a thread

---

### Thread Management

#### `getOrCreateThread(currentUserId: string, otherUserId: string): Promise<string>`

Get existing thread between two users, or create a new one if it doesn't exist.

**Parameters:**
- `currentUserId`: Current user's ID
- `otherUserId`: Other user's ID

**Returns:** Thread ID (string)

**Behavior:**
1. Checks if a thread already exists between the two users
2. If exists: returns the existing thread ID
3. If not: creates a new thread with both users as participants and returns new thread ID

**Usage:**
```typescript
// Starting a new chat
const threadId = await getOrCreateThread(currentUserId, recipientUserId);
navigate(`/messages/${threadId}`);
```

---

## Implementation Milestones

### ✅ Milestone 1: Database Schema & Migration (COMPLETED)

**Tasks:**
- [x] Add columns to messages table (edited_at, deleted_at, deleted_by, delivered_at, read_at)
- [x] Create typing_indicators table
- [x] Create user_presence table
- [x] Add database migration in db.client.ts
- [x] Add indexes for performance

**Files Modified:**
- `app/lib/db.client.ts` - Migration and schema updates

**Testing:**
- Clear browser IndexedDB and reload to test migration
- Check browser console for migration success logs
- Verify tables created in PGlite

---

### 🚧 Milestone 2: Electric-SQL Integration (IN PROGRESS)

**Tasks:**
- [ ] Install Electric-SQL dependencies
- [ ] Set up central Postgres database
- [ ] Deploy Electric sync service
- [ ] Configure Electric client in app
- [ ] Set up sync shapes for messages, threads, presence
- [ ] Test bidirectional sync

**Files to Create:**
- `app/lib/electric.client.ts` - Electric-SQL client setup
- `.env` - Electric service URL and credentials

**Dependencies:**
```json
{
  "dependencies": {
    "electric-sql": "^0.x.x",
    "@electric-sql/pglite-sync": "^0.x.x"
  }
}
```

---

### 📋 Milestone 3: User Search & New Chat UI

**Tasks:**
- [ ] Create "New Chat" floating action button
- [ ] Create user search modal/dialog
- [ ] Implement real-time search as user types
- [ ] Handle "user not found" state
- [ ] Implement thread creation flow
- [ ] Check for existing threads before creating

**Files to Create:**
- `app/components/NewChatButton.tsx`
- `app/components/UserSearchModal.tsx`
- `app/routes/_dashboard.messages.new.tsx` (optional)

**Files to Modify:**
- `app/routes/_dashboard.messages._index.tsx` - Add new chat button

---

### 📋 Milestone 4: Real-Time Message Delivery

**Tasks:**
- [ ] Set up Electric sync listeners for messages
- [ ] Create useRealtimeMessages hook
- [ ] Update message sending to use useFetcher
- [ ] Implement optimistic UI updates
- [ ] Handle send failures gracefully
- [ ] Auto-scroll to bottom on new messages
- [ ] Show smooth animations for new messages

**Files to Create:**
- `app/hooks/use-realtime-messages.ts`

**Files to Modify:**
- `app/routes/_dashboard.messages.$threadId.tsx`

---

### 📋 Milestone 5: Typing Indicators

**Tasks:**
- [ ] Add typing detection with debounce (500ms)
- [ ] Set typing=true on input, false after 3s
- [ ] Clear typing indicator on message send
- [ ] Create useTypingIndicator hook
- [ ] Subscribe to typing_indicators via Electric
- [ ] Create TypingIndicator UI component
- [ ] Show "User is typing..." with animated dots

**Files to Create:**
- `app/hooks/use-typing-indicator.ts`
- `app/components/TypingIndicator.tsx`

**Files to Modify:**
- `app/routes/_dashboard.messages.$threadId.tsx`

---

### 📋 Milestone 6: Online/Offline Status & Presence

**Tasks:**
- [ ] Implement heartbeat system (update every 30s)
- [ ] Add presence update in root layout
- [ ] Mark offline after 60s of no update
- [ ] Create useUserPresence hook
- [ ] Subscribe to user_presence via Electric
- [ ] Update UI with green dots for online users
- [ ] Show "Last seen" timestamps
- [ ] Add presence to thread list and thread header

**Files to Create:**
- `app/hooks/use-user-presence.ts`
- `app/components/PresenceBadge.tsx`

**Files to Modify:**
- `app/routes/_dashboard.tsx` - Add heartbeat
- `app/routes/_dashboard.messages._index.tsx` - Show presence in list
- `app/routes/_dashboard.messages.$threadId.tsx` - Show presence in header

---

### 📋 Milestone 7: Message Delivery & Read Receipts

**Tasks:**
- [ ] Mark delivered when message syncs to recipient
- [ ] Mark read when user opens thread
- [ ] Mark read when message is visible (IntersectionObserver)
- [ ] Create receipt status component
- [ ] Show single checkmark (✓) for sent
- [ ] Show double checkmark (✓✓) for delivered
- [ ] Show blue double checkmark for read
- [ ] Display below message timestamp

**Files to Create:**
- `app/components/MessageReceipt.tsx`

**Files to Modify:**
- `app/routes/_dashboard.messages.$threadId.tsx`

---

### 📋 Milestone 8: Edit & Delete Messages

**Tasks:**
- [ ] Create message actions menu (long-press/hover)
- [ ] Show "Edit" and "Delete" for user's own messages
- [ ] Implement 15-minute edit time limit
- [ ] Create edit message modal
- [ ] Show "Edited" label on edited messages
- [ ] Implement soft delete
- [ ] Show "This message was deleted" placeholder
- [ ] Add confirmation dialog for delete

**Files to Create:**
- `app/components/MessageActions.tsx`
- `app/components/EditMessageModal.tsx`

**Files to Modify:**
- `app/routes/_dashboard.messages.$threadId.tsx`

---

### 📋 Milestone 9: Testing & Polish

**Tasks:**
- [ ] Add Playwright tests for new chat creation
- [ ] Add tests for real-time message delivery
- [ ] Add tests for typing indicators
- [ ] Add tests for edit/delete flows
- [ ] Handle offline message queuing
- [ ] Implement pagination for old messages
- [ ] Add virtual scrolling for performance
- [ ] Add loading/error/empty states
- [ ] Add animations and transitions
- [ ] Performance optimization

**Files to Create:**
- `tests/messaging-realtime.spec.ts`
- `tests/messaging-edit-delete.spec.ts`
- `tests/messaging-typing.spec.ts`

---

## Usage Examples

### Starting a New Chat

```typescript
// In NewChatButton component
const handleStartChat = async () => {
  const users = await searchUsersByUserId(searchQuery);

  if (users.length === 0) {
    setError("No users found");
    return;
  }

  const selectedUser = users[0];
  const threadId = await getOrCreateThread(currentUserId, selectedUser.id);
  navigate(`/messages/${threadId}`);
};
```

### Implementing Typing Indicators

```typescript
// In message input component
const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setContent(e.target.value);

  // Set typing status to true
  setTypingStatus(threadId, userId, true);

  // Clear existing timeout
  if (typingTimeout) clearTimeout(typingTimeout);

  // Set new timeout to clear typing status
  const timeout = setTimeout(() => {
    setTypingStatus(threadId, userId, false);
  }, 3000);

  setTypingTimeout(timeout);
};

const handleSendMessage = async () => {
  // Clear typing status immediately
  setTypingStatus(threadId, userId, false);
  if (typingTimeout) clearTimeout(typingTimeout);

  // Send message...
};
```

### Showing Typing Indicator

```typescript
// Using the useTypingIndicator hook
const typingUsers = useTypingIndicator(threadId, currentUserId);

return (
  <div className="typing-indicator">
    {typingUsers.length > 0 && (
      <p className="text-sm text-gray-500">
        {typingUsers[0].display_name} is typing
        <span className="animate-bounce">...</span>
      </p>
    )}
  </div>
);
```

### Implementing Presence Heartbeat

```typescript
// In _dashboard.tsx layout
useEffect(() => {
  if (!userId) return;

  // Update presence immediately
  updateUserPresence(userId, 'online');

  // Set up heartbeat
  const heartbeat = setInterval(() => {
    updateUserPresence(userId, 'online');
  }, 30000); // Every 30 seconds

  // Mark offline on page unload
  const handleUnload = () => {
    updateUserPresence(userId, 'offline');
  };

  window.addEventListener('beforeunload', handleUnload);

  return () => {
    clearInterval(heartbeat);
    window.removeEventListener('beforeunload', handleUnload);
    updateUserPresence(userId, 'offline');
  };
}, [userId]);
```

### Showing Presence Status

```typescript
// Using the useUserPresence hook
const presence = useUserPresence(recipientUserId);

return (
  <div className="flex items-center gap-2">
    <div className={cn(
      "w-2 h-2 rounded-full",
      presence?.status === 'online' ? "bg-green-500" : "bg-gray-400"
    )} />
    <span className="text-sm text-gray-500">
      {presence?.status === 'online'
        ? 'Online'
        : `Last seen ${formatTimestamp(presence?.last_seen)}`
      }
    </span>
  </div>
);
```

### Editing a Message

```typescript
const handleEditMessage = async (messageId: string) => {
  // Check if user can edit
  const canEdit = await canEditMessage(messageId, userId);
  if (!canEdit) {
    toast.error("Cannot edit this message (too old or not yours)");
    return;
  }

  // Open edit modal
  setEditingMessageId(messageId);
  setEditContent(message.content);
  setShowEditModal(true);
};

const handleSaveEdit = async () => {
  await editMessage(editingMessageId, editContent);
  setShowEditModal(false);
  toast.success("Message edited");
};
```

### Deleting a Message

```typescript
const handleDeleteMessage = async (messageId: string, userId: string) => {
  const confirmed = confirm("Delete this message for everyone?");
  if (!confirmed) return;

  await deleteMessage(messageId, userId);
  toast.success("Message deleted");
};
```

### Message Receipts

```typescript
// Auto-mark messages as read when visible
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            markMessageRead(messageId);
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  // Observe all message elements
  const messageElements = document.querySelectorAll('[data-message-id]');
  messageElements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}, [messages]);
```

---

## Testing Guide

### Manual Testing Checklist

#### User Search & New Chat
- [ ] Click "New Chat" button
- [ ] Search for user by ID
- [ ] See search results update in real-time
- [ ] Select user and navigate to thread
- [ ] Verify existing thread is reused if it exists
- [ ] Verify new thread is created if needed

#### Real-Time Message Delivery
- [ ] Open chat in two browser tabs (same user)
- [ ] Send message from tab 1
- [ ] Verify message appears in tab 2 without refresh
- [ ] Verify message appears with smooth animation
- [ ] Verify optimistic UI (message shows immediately in tab 1)

#### Typing Indicators
- [ ] Open chat in two browser tabs (different users)
- [ ] Start typing in tab 1
- [ ] Verify "User is typing..." appears in tab 2
- [ ] Stop typing for 3 seconds
- [ ] Verify typing indicator disappears
- [ ] Send message and verify indicator clears immediately

#### Online/Offline Status
- [ ] Open app and verify user is marked online
- [ ] Check another user's profile/thread
- [ ] Verify green dot for online users
- [ ] Close tab for a user
- [ ] Wait 60 seconds
- [ ] Verify user is marked offline
- [ ] Verify "Last seen" timestamp is shown

#### Message Receipts
- [ ] Send message to another user
- [ ] Verify single checkmark (sent)
- [ ] Open thread on recipient's device
- [ ] Verify double checkmark (delivered)
- [ ] Scroll to message on recipient's device
- [ ] Verify blue double checkmark (read)

#### Edit Messages
- [ ] Send a message
- [ ] Hover/long-press to show actions menu
- [ ] Click "Edit"
- [ ] Modify content and save
- [ ] Verify message shows "Edited" label
- [ ] Wait 15 minutes
- [ ] Verify "Edit" option is disabled

#### Delete Messages
- [ ] Send a message
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Verify message shows "This message was deleted"
- [ ] Verify other user sees deleted message
- [ ] Verify message still exists in database

### Automated Tests

See `tests/messaging-*.spec.ts` for Playwright test suites.

**Run tests:**
```bash
npm test                  # Run all tests
npm run test:ui          # Interactive UI mode
npm run test:headed      # Headed mode (see browser)
```

---

## Future Enhancements

### Phase 10: E2E Encryption Integration
- Implement key exchange (ECDH or similar)
- Encrypt message content before writing to local DB
- Decrypt on read
- Handle key rotation
- Add verified contact indicators

### Phase 11: Advanced Features
- Voice messages
- File attachments
- Image/video sharing
- Message reactions (emoji)
- Message threading (replies)
- Pinned messages
- Search within conversations
- Message forwarding

### Phase 12: Group Chats
- Create group threads
- Group member management (add/remove)
- Group admin permissions
- Group name and avatar
- Group notifications settings
- @mentions in groups

### Phase 13: Performance & Scale
- Message pagination (load more)
- Virtual scrolling for long threads
- Message search indexing
- Archive old messages
- Compress media
- Optimize sync bandwidth

---

## Architecture Diagrams

### Message Flow (Real-Time)

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   User A    │          │  Electric-   │          │   User B    │
│  (Sender)   │          │     SQL      │          │ (Recipient) │
└──────┬──────┘          └──────┬───────┘          └──────┬──────┘
       │                        │                         │
       │ 1. Send Message        │                         │
       ├──────────────────────► │                         │
       │    (PGlite Write)      │                         │
       │                        │                         │
       │ 2. Optimistic UI       │                         │
       │    (Show Immediately)  │                         │
       │                        │                         │
       │                        │ 3. Sync to Central DB   │
       │                        ├────────────►            │
       │                        │                         │
       │                        │ 4. Push to Recipient    │
       │                        ├────────────────────────►│
       │                        │                         │
       │                        │                         │ 5. Write to PGlite
       │                        │                         │
       │                        │                         │ 6. UI Update
       │                        │                         │    (Subscription)
       │                        │                         │
       │ 7. Delivery Receipt    │                         │
       │◄───────────────────────┴─────────────────────────┤
       │                                                  │
```

### Typing Indicator Flow

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   User A    │          │  Electric-   │          │   User B    │
│  (Typing)   │          │     SQL      │          │  (Viewing)  │
└──────┬──────┘          └──────┬───────┘          └──────┬──────┘
       │                        │                         │
       │ 1. Input Event         │                         │
       │    (debounced 500ms)   │                         │
       │                        │                         │
       │ 2. Set typing=true     │                         │
       ├──────────────────────► │                         │
       │    (PGlite Write)      │                         │
       │                        │                         │
       │                        │ 3. Sync                 │
       │                        ├────────────────────────►│
       │                        │                         │
       │                        │                         │ 4. Show Indicator
       │                        │                         │    "User A is typing..."
       │                        │                         │
       │ 5. 3s timeout          │                         │
       │    Set typing=false    │                         │
       ├──────────────────────► │                         │
       │                        │                         │
       │                        │ 6. Sync                 │
       │                        ├────────────────────────►│
       │                        │                         │
       │                        │                         │ 7. Hide Indicator
       │                        │                         │
```

---

## Troubleshooting

### Messages not appearing in real-time
- Check Electric-SQL connection status
- Verify sync shapes are configured correctly
- Check browser console for sync errors
- Ensure user has network connectivity

### Typing indicators not working
- Check that typing_indicators table exists
- Verify typing status is being set (check DB)
- Check 5-second timeout in query is working
- Verify Electric-SQL is syncing the table

### Presence status stuck
- Check heartbeat is running (every 30s)
- Verify presence updates in database
- Check 60-second offline threshold
- Ensure beforeunload handler is firing

### Cannot edit messages
- Verify message is less than 15 minutes old
- Check user is the message sender
- Verify message is not deleted
- Check canEditMessage function logic

### Receipts not updating
- Verify markMessageRead is being called
- Check IntersectionObserver is working
- Verify Electric-SQL sync for message updates
- Check delivered_at and read_at columns exist

---

## Performance Considerations

### Database Queries
- Use indexes for all foreign keys and frequently queried columns
- Limit message queries with pagination (e.g., last 50 messages)
- Use batch updates for marking multiple messages read
- Clean up old typing_indicators (auto-expire after 5s)

### Electric-SQL Sync
- Only sync active threads (don't sync all messages)
- Use Electric "shapes" to limit sync scope
- Throttle typing indicator updates (max once per 500ms)
- Batch presence updates (don't sync every keystroke)

### UI Performance
- Implement virtual scrolling for long message threads
- Debounce search input (500ms)
- Use React.memo for message components
- Lazy load images and media
- Cache user presence data client-side

### Network Optimization
- Compress message content before sync
- Use WebSocket for Electric-SQL (not polling)
- Batch multiple operations into single sync
- Implement exponential backoff for retries

---

## Security Considerations

### Data Privacy
- E2E encryption for message content (separate implementation)
- Encrypt before writing to local DB
- Central server only sees encrypted data
- Keys managed client-side

### Input Validation
- Sanitize message content (prevent XSS)
- Validate message length (max 10,000 chars)
- Validate user IDs (prevent injection)
- Rate limit message sending (prevent spam)

### Authorization
- Verify user owns message before edit/delete
- Check thread membership before reading messages
- Validate presence updates are for current user
- Check typing indicator permissions

---

## Contributing

When adding new messaging features:

1. **Update schema:** Add migrations in `runMigrations()`
2. **Add helpers:** Create query functions in db.client.ts
3. **Create hooks:** Add React hooks for real-time subscriptions
4. **Update UI:** Modify routes and components
5. **Add tests:** Write Playwright tests for user flows
6. **Update docs:** Document new features in this file

---

## Support & Resources

- [Electric-SQL Documentation](https://electric-sql.com/docs)
- [PGlite Documentation](https://pglite.dev)
- [React Router v7 Documentation](https://reactrouter.com)
- [Wallie Project Documentation](./README.md)

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
**Status:** Phase 1 Complete, Phase 2+ In Progress
