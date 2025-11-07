# End-to-End Encryption (E2E) for Wallie Messages

## Overview

This document outlines the technical implementation of end-to-end encryption for Wallie's one-to-one messaging system. E2E encryption ensures that only the sender and recipient can read message content—not even the Wallie server can decrypt messages.

**Status:** 📋 Planning Phase
**Target:** Milestone 10 (post-MVP)
**Complexity:** High
**Estimated Effort:** 2-3 weeks

---

## Table of Contents

1. [Why E2E Encryption?](#why-e2e-encryption)
2. [Cryptography Approach](#cryptography-approach)
3. [Key Management](#key-management)
4. [Message Flow](#message-flow)
5. [Database Schema](#database-schema)
6. [Implementation Plan](#implementation-plan)
7. [Security Considerations](#security-considerations)
8. [User Experience](#user-experience)
9. [Testing Strategy](#testing-strategy)
10. [Future Enhancements](#future-enhancements)

---

## Why E2E Encryption?

### Benefits
- **Privacy:** Server cannot read user messages
- **Security:** Protection against server breaches
- **Trust:** Users control their own data
- **Compliance:** Meets privacy regulations (GDPR, etc.)

### Tradeoffs
- **Complexity:** More complex key management
- **Search:** Cannot search encrypted content server-side
- **Backup:** Users responsible for backing up keys
- **Recovery:** Lost keys = lost messages

---

## Cryptography Approach

We will use the **Web Crypto API** (SubtleCrypto) for a simplified but secure implementation:

### Algorithms

**1. Key Exchange: ECDH (Elliptic Curve Diffie-Hellman)**
- Generate key pairs for each user (P-256 curve)
- Exchange public keys to derive shared secret
- One shared secret per conversation thread

**2. Message Encryption: AES-GCM (256-bit)**
- Symmetric encryption using shared secret
- Authenticated encryption (prevents tampering)
- Each message has unique IV (Initialization Vector)

**3. Key Derivation: PBKDF2**
- Derive encryption keys from shared ECDH secret
- Add salt for additional security

### Why Not Signal Protocol?

While Signal Protocol is the gold standard for messaging encryption, it's complex to implement correctly. For Wallie's initial E2E implementation, we're using a simpler but still secure approach:

**Signal Protocol:**
- ✅ Forward secrecy (compromised keys don't expose past messages)
- ✅ Post-compromise security (recovers from key exposure)
- ❌ Very complex (ratcheting, key chains, etc.)
- ❌ Larger library dependencies

**Our Approach (ECDH + AES-GCM):**
- ✅ Simple to implement and audit
- ✅ Uses standard Web Crypto API (no dependencies)
- ✅ Strong encryption (AES-256-GCM)
- ✅ Authenticated encryption (prevents tampering)
- ⚠️ No forward secrecy (can add later with key rotation)

**Future:** We can migrate to Signal Protocol in Phase 2 if needed.

---

## Key Management

### Key Storage

**Client-Side (IndexedDB):**
```typescript
interface UserKeys {
  userId: string;
  privateKey: CryptoKey;        // User's private ECDH key (non-extractable)
  publicKey: CryptoKey;         // User's public ECDH key
  publicKeyRaw: Uint8Array;     // Public key for sharing
  createdAt: Date;
  deviceId: string;             // For multi-device support (future)
}

interface ThreadKeys {
  threadId: string;
  otherUserId: string;
  otherUserPublicKey: Uint8Array;
  sharedSecret: CryptoKey;      // Derived shared encryption key
  status: 'pending' | 'established';
  establishedAt: Date | null;
}
```

**Server-Side (Postgres):**
```sql
CREATE TABLE user_public_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  public_key BYTEA NOT NULL,           -- Raw public key bytes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE key_exchange_requests (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id),
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id TEXT NOT NULL REFERENCES users(id),
  from_public_key BYTEA NOT NULL,
  to_public_key BYTEA,                 -- Filled when accepted
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);
```

### Key Generation

Keys are generated when:
1. User first signs up (one-time)
2. User resets their keys (optional, future feature)
3. User logs in on a new device (multi-device, future feature)

```typescript
async function generateUserKeys(userId: string): Promise<UserKeys> {
  // Generate ECDH key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,  // extractable (for export/backup)
    ['deriveKey', 'deriveBits']
  );

  // Export public key for sharing
  const publicKeyRaw = await crypto.subtle.exportKey(
    'raw',
    keyPair.publicKey
  );

  // Store in IndexedDB
  const userKeys: UserKeys = {
    userId,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyRaw: new Uint8Array(publicKeyRaw),
    createdAt: new Date(),
    deviceId: generateDeviceId(),
  };

  await storeUserKeys(userKeys);

  // Upload public key to server
  await uploadPublicKey(userId, publicKeyRaw);

  return userKeys;
}
```

---

## Message Flow

### 1. Key Exchange Flow (First Message)

```
┌─────────────┐                      ┌──────────────┐                      ┌─────────────┐
│   Alice     │                      │    Server    │                      │     Bob     │
└──────┬──────┘                      └──────┬───────┘                      └──────┬──────┘
       │                                    │                                     │
       │ 1. Start new chat with Bob         │                                     │
       ├───────────────────────────────────►│                                     │
       │    GET /api/users/bob/public-key   │                                     │
       │                                    │                                     │
       │ 2. Bob's public key                │                                     │
       │◄───────────────────────────────────┤                                     │
       │    { publicKey: "..." }            │                                     │
       │                                    │                                     │
       │ 3. Derive shared secret            │                                     │
       │    (Alice private + Bob public)    │                                     │
       │                                    │                                     │
       │ 4. Send encrypted message          │                                     │
       ├───────────────────────────────────►│                                     │
       │    POST /api/messages              │                                     │
       │    {                               │                                     │
       │      content: <encrypted>,         │                                     │
       │      iv: "...",                    │                                     │
       │      encrypted: true,              │                                     │
       │      senderPublicKey: "..."        │                                     │
       │    }                               │                                     │
       │                                    │                                     │
       │                                    │ 5. Store encrypted message          │
       │                                    ├────────────────────────────────────►│
       │                                    │                                     │
       │                                    │                                     │ 6. Get Alice's public key
       │                                    │                                     │    (from message)
       │                                    │                                     │
       │                                    │                                     │ 7. Derive shared secret
       │                                    │                                     │    (Bob private + Alice public)
       │                                    │                                     │
       │                                    │                                     │ 8. Decrypt message
       │                                    │                                     │    Show in UI
```

**Key Points:**
- No explicit "approval" required
- First message includes sender's public key
- Recipient automatically derives shared secret when they receive message
- Shared secret is cached for future messages in the thread

### 2. Subsequent Message Flow

```
┌─────────────┐                      ┌──────────────┐                      ┌─────────────┐
│   Alice     │                      │    Server    │                      │     Bob     │
└──────┬──────┘                      └──────┬───────┘                      └──────┬──────┘
       │                                    │                                     │
       │ 1. Type message                    │                                     │
       │    "Hello Bob!"                    │                                     │
       │                                    │                                     │
       │ 2. Encrypt with shared secret      │                                     │
       │    encrypted = AES-GCM(message)    │                                     │
       │                                    │                                     │
       │ 3. Send to server                  │                                     │
       ├───────────────────────────────────►│                                     │
       │    POST /api/messages              │                                     │
       │    {                               │                                     │
       │      content: "xF3k9...",          │ <-- encrypted base64               │
       │      iv: "aB7jK...",               │ <-- random IV                      │
       │      encrypted: true               │                                     │
       │    }                               │                                     │
       │                                    │                                     │
       │                                    │ 4. Store as-is (still encrypted)    │
       │                                    ├────────────────────────────────────►│
       │                                    │                                     │
       │                                    │                                     │ 5. Decrypt with shared secret
       │                                    │                                     │    plaintext = AES-GCM-decrypt(content, IV)
       │                                    │                                     │
       │                                    │                                     │ 6. Show in UI
       │                                    │                                     │    "Hello Bob!"
```

**Key Points:**
- Server stores encrypted content as-is
- Server cannot read message content
- Each message has unique IV (prevents pattern analysis)
- Fast: Only symmetric encryption (AES-GCM)

---

## Database Schema

### Changes to Existing Schema

**Messages Table:**
```sql
ALTER TABLE messages
  ADD COLUMN encrypted BOOLEAN DEFAULT FALSE,
  ADD COLUMN iv BYTEA,                    -- Initialization Vector for AES-GCM
  ADD COLUMN sender_public_key BYTEA;     -- Sender's public key (for first message)
```

**New Table: user_public_keys**
```sql
CREATE TABLE user_public_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,              -- Raw ECDH public key
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_public_keys_created ON user_public_keys(created_at);
```

**Migration in Drizzle:**
```typescript
// app/db/schema.ts
export const userPublicKeys = pgTable('user_public_keys', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(), // Base64 encoded
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Tasks:**
- [ ] Create `app/lib/crypto.client.ts` - Encryption utilities
- [ ] Implement key generation functions
- [ ] Implement key storage in IndexedDB
- [ ] Create database migration for public keys table
- [ ] Add public key upload on signup

**Files to Create:**
```
app/lib/crypto.client.ts          # Core crypto functions
app/lib/crypto-storage.client.ts  # IndexedDB key storage
app/db/services/crypto.ts          # Server-side key operations
```

**Key Functions:**
```typescript
// app/lib/crypto.client.ts

/** Generate new ECDH key pair for user */
export async function generateUserKeys(userId: string): Promise<UserKeys>;

/** Derive shared secret from two public keys */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  otherPublicKey: Uint8Array
): Promise<CryptoKey>;

/** Encrypt message content */
export async function encryptMessage(
  content: string,
  sharedSecret: CryptoKey
): Promise<{ encrypted: string; iv: string }>;

/** Decrypt message content */
export async function decryptMessage(
  encrypted: string,
  iv: string,
  sharedSecret: CryptoKey
): Promise<string>;

/** Store user keys in IndexedDB */
export async function storeUserKeys(keys: UserKeys): Promise<void>;

/** Retrieve user keys from IndexedDB */
export async function getUserKeys(userId: string): Promise<UserKeys | null>;

/** Store thread encryption keys */
export async function storeThreadKeys(keys: ThreadKeys): Promise<void>;

/** Retrieve thread encryption keys */
export async function getThreadKeys(threadId: string): Promise<ThreadKeys | null>;
```

### Phase 2: Key Exchange (Week 2)

**Tasks:**
- [ ] Add public key upload to signup flow
- [ ] Create API endpoint to fetch user public keys
- [ ] Implement automatic key exchange on first message
- [ ] Test key derivation between two users
- [ ] Add error handling for missing/invalid keys

**API Endpoints:**
```typescript
// app/routes/api.users.$userId.public-key.tsx
export async function loader({ params }: Route.LoaderArgs) {
  const { userId } = params;
  const publicKey = await getPublicKey(userId);
  return { publicKey: base64Encode(publicKey) };
}

// app/routes/api.keys.upload.tsx
export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const { publicKey } = await request.json();
  await storePublicKey(userId, base64Decode(publicKey));
  return { success: true };
}
```

### Phase 3: Message Encryption (Week 2-3)

**Tasks:**
- [ ] Modify `sendMessage` to encrypt content before sending
- [ ] Modify `getMessagesInThread` to decrypt on retrieval
- [ ] Update message input component to use encryption
- [ ] Add loading states during encryption/decryption
- [ ] Handle encryption errors gracefully

**Changes to Messages Route:**
```typescript
// app/routes/_dashboard.messages.$threadId.tsx

// CLIENT ACTION (encrypt before send)
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const { threadId } = params;
  const formData = await request.formData();
  const content = formData.get("content") as string;

  // Get or establish thread keys
  let threadKeys = await getThreadKeys(threadId);
  if (!threadKeys) {
    // First message - establish keys
    threadKeys = await establishThreadKeys(threadId);
  }

  // Encrypt message
  const { encrypted, iv } = await encryptMessage(
    content,
    threadKeys.sharedSecret
  );

  // Send encrypted message to server
  await fetch(`/api/messages`, {
    method: "POST",
    body: JSON.stringify({
      threadId,
      content: encrypted,
      iv: iv,
      encrypted: true,
    }),
  });

  return { success: true };
}

// CLIENT LOADER (decrypt on load)
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { threadId } = params;

  // Fetch encrypted messages from server
  const response = await fetch(`/api/messages/thread/${threadId}`);
  const { messages } = await response.json();

  // Get thread keys
  const threadKeys = await getThreadKeys(threadId);
  if (!threadKeys) {
    // Cannot decrypt without keys
    return { messages: [], error: "Encryption keys not found" };
  }

  // Decrypt each message
  const decrypted = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.encrypted) {
        return msg; // Not encrypted (legacy message)
      }

      try {
        const plaintext = await decryptMessage(
          msg.content,
          msg.iv,
          threadKeys.sharedSecret
        );
        return { ...msg, content: plaintext };
      } catch (error) {
        console.error("Decryption failed for message:", msg.id, error);
        return { ...msg, content: "[Failed to decrypt]" };
      }
    })
  );

  return { messages: decrypted };
}
```

### Phase 4: Testing & Polish (Week 3)

**Tasks:**
- [ ] Write unit tests for crypto functions
- [ ] Write integration tests for key exchange
- [ ] Test message encryption/decryption E2E
- [ ] Add user-facing encryption indicators
- [ ] Add "verified" badge when keys are established
- [ ] Handle edge cases (deleted keys, corrupted data, etc.)

---

## Security Considerations

### Threat Model

**What E2E Encryption Protects Against:**
- ✅ Server administrator reading messages
- ✅ Database breach exposing message content
- ✅ Man-in-the-middle attacks (if using HTTPS)
- ✅ Third-party access to server data

**What E2E Encryption Does NOT Protect Against:**
- ❌ Compromised client device (malware, keylogger)
- ❌ Malicious client code (XSS attack)
- ❌ User's browser being compromised
- ❌ Screenshot/screen recording attacks
- ❌ Social engineering attacks

### Security Best Practices

1. **Key Storage**
   - Store private keys in IndexedDB (non-extractable)
   - Never send private keys to server
   - Clear keys on logout (optional)

2. **Random Number Generation**
   - Use `crypto.getRandomValues()` for IVs
   - Never reuse IVs (unique per message)
   - Use cryptographically secure randomness

3. **Key Verification (Future)**
   - Add "safety numbers" for out-of-band verification
   - Display fingerprint of other user's public key
   - Allow users to manually verify keys

4. **Forward Secrecy (Future)**
   - Implement key rotation every N messages
   - Use ratcheting algorithm (Signal-style)
   - Delete old keys after rotation

5. **Backup & Recovery**
   - Warn users that lost keys = lost messages
   - Optionally: Encrypted key backup to server
   - Multi-device: Sync keys between devices (E2E encrypted)

### Known Limitations

1. **No Forward Secrecy:** If a user's private key is compromised, all past messages in that thread can be decrypted. Mitigation: Implement key rotation in Phase 2.

2. **No Post-Compromise Security:** If a key is compromised, future messages are also at risk until keys are rotated. Mitigation: Add Signal Protocol ratcheting.

3. **Metadata Not Encrypted:** Server can see who messages whom and when (but not content). Mitigation: This is acceptable for most use cases.

4. **Client-Side Attacks:** Malicious JavaScript can steal keys. Mitigation: Use CSP headers, regular security audits.

---

## User Experience

### Key Exchange UX (Transparent)

**Good UX:** Users shouldn't need to understand encryption to use it.

```
┌────────────────────────────────────────────────┐
│  Messages  ·  @bob                       🔒    │
├────────────────────────────────────────────────┤
│                                                │
│  🔐 This chat is end-to-end encrypted         │
│  Only you and @bob can read these messages    │
│                                                │
│  ┌────────────────────────────────┐           │
│  │ Hey Bob! Want to grab lunch?   │           │
│  └────────────────────────────────┘  10:32 AM │
│                                                │
│  ┌────────────────────────────────┐           │
│  │ Sure! Where do you want to go? │           │
│  └────────────────────────────────┘  10:33 AM │
│                                                │
└────────────────────────────────────────────────┘
```

**First Message:**
- Show brief one-time notice: "🔐 Encryption keys established"
- Add lock icon to thread header
- No manual approval needed

**Subsequent Messages:**
- Transparent encryption/decryption
- No user action required
- Show lock icon in thread list

### Error Handling

**Missing Keys:**
```
┌────────────────────────────────────────────────┐
│  ⚠️  Cannot decrypt this message               │
│                                                │
│  Your encryption keys may be missing.         │
│  [Learn More]  [Reset Keys]                   │
└────────────────────────────────────────────────┘
```

**Decryption Failed:**
```
┌────────────────────────────────────────────────┐
│  [Failed to decrypt - corrupted message]       │
└────────────────────────────────────────────────┘
```

### Settings Page

Add encryption settings:
```
🔐 Encryption
  ├─ Your Public Key: 04:3a:f2... [Copy]
  ├─ Key Created: Jan 1, 2025
  ├─ [Export Encryption Keys]      # For backup
  └─ [Reset Encryption Keys]       # Nuclear option
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/crypto.test.ts

describe('Encryption', () => {
  it('should generate valid ECDH key pair', async () => {
    const keys = await generateUserKeys('user123');
    expect(keys.privateKey).toBeDefined();
    expect(keys.publicKey).toBeDefined();
    expect(keys.publicKeyRaw).toBeInstanceOf(Uint8Array);
  });

  it('should derive same shared secret from both sides', async () => {
    const alice = await generateUserKeys('alice');
    const bob = await generateUserKeys('bob');

    const aliceSecret = await deriveSharedSecret(alice.privateKey, bob.publicKeyRaw);
    const bobSecret = await deriveSharedSecret(bob.privateKey, alice.publicKeyRaw);

    // Secrets should be identical
    const aliceBits = await crypto.subtle.exportKey('raw', aliceSecret);
    const bobBits = await crypto.subtle.exportKey('raw', bobSecret);

    expect(new Uint8Array(aliceBits)).toEqual(new Uint8Array(bobBits));
  });

  it('should encrypt and decrypt message', async () => {
    const alice = await generateUserKeys('alice');
    const bob = await generateUserKeys('bob');
    const sharedSecret = await deriveSharedSecret(alice.privateKey, bob.publicKeyRaw);

    const message = 'Hello, Bob!';
    const { encrypted, iv } = await encryptMessage(message, sharedSecret);
    const decrypted = await decryptMessage(encrypted, iv, sharedSecret);

    expect(decrypted).toBe(message);
  });

  it('should fail to decrypt with wrong key', async () => {
    const alice = await generateUserKeys('alice');
    const bob = await generateUserKeys('bob');
    const eve = await generateUserKeys('eve');

    const aliceSecret = await deriveSharedSecret(alice.privateKey, bob.publicKeyRaw);
    const eveSecret = await deriveSharedSecret(eve.privateKey, bob.publicKeyRaw);

    const { encrypted, iv } = await encryptMessage('Secret!', aliceSecret);

    await expect(
      decryptMessage(encrypted, iv, eveSecret)
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/e2e-encryption.spec.ts

test('should send encrypted message between users', async ({ page, context }) => {
  // Create two users
  const alice = await page;
  const bob = await context.newPage();

  // Alice signs up and generates keys
  await alice.goto('/signup');
  await alice.fill('input[name="username"]', 'alice');
  await alice.click('button[type="submit"]');
  // Wait for key generation...

  // Bob signs up and generates keys
  await bob.goto('/signup');
  await bob.fill('input[name="username"]', 'bob');
  await bob.click('button[type="submit"]');
  // Wait for key generation...

  // Alice starts chat with Bob
  await alice.goto('/messages');
  await alice.click('button:has-text("New Chat")');
  await alice.fill('input[placeholder="Search users"]', 'bob');
  await alice.click('text=@bob');

  // Alice sends encrypted message
  await alice.fill('input[placeholder="Type a message"]', 'Hello Bob!');
  await alice.click('button:has-text("Send")');

  // Verify encryption indicator
  await expect(alice.locator('text=🔐')).toBeVisible();

  // Bob receives and decrypts message
  await bob.goto('/messages');
  await bob.click('text=@alice');
  await expect(bob.locator('text=Hello Bob!')).toBeVisible();
  await expect(bob.locator('text=🔐')).toBeVisible();
});
```

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Key Rotation**
   - Automatically rotate keys every 1000 messages or 30 days
   - Implement Double Ratchet algorithm (Signal Protocol)
   - Achieve forward secrecy

2. **Multi-Device Support**
   - Sync encryption keys across user's devices
   - Use device-to-device encrypted channel
   - Add device management UI

3. **Key Verification**
   - Add "safety numbers" for manual verification
   - QR code scanning for in-person verification
   - Show warning if keys change unexpectedly

4. **Backup & Recovery**
   - Export encrypted key backup file
   - Upload encrypted backup to server (password-protected)
   - Restore keys on new device

5. **Group Encryption**
   - Sender keys protocol (for group efficiency)
   - Add/remove members with re-keying
   - Handle large group chats

### Phase 3: Signal Protocol Migration

If we need stronger security guarantees, migrate to Signal Protocol:

**Benefits:**
- Forward secrecy (compromised keys don't expose past messages)
- Post-compromise security (automatic recovery after compromise)
- Industry-standard protocol (well-audited)

**Challenges:**
- Complex implementation (~5000 lines of code)
- Requires careful state management
- More storage overhead (key chains, ratchets)

**Library:** Use `libsignal-protocol-typescript` for implementation

---

## Reference Implementation

### Crypto Utilities (Simplified)

```typescript
// app/lib/crypto.client.ts

import { base64Encode, base64Decode } from '~/lib/utils';

const ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

const AES_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

/** Generate ECDH key pair for user */
export async function generateUserKeys(userId: string): Promise<UserKeys> {
  const keyPair = await crypto.subtle.generateKey(
    ALGORITHM,
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  const publicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', keyPair.publicKey)
  );

  return {
    userId,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyRaw,
    createdAt: new Date(),
    deviceId: generateDeviceId(),
  };
}

/** Derive shared AES key from ECDH key exchange */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  otherPublicKeyRaw: Uint8Array
): Promise<CryptoKey> {
  // Import other user's public key
  const otherPublicKey = await crypto.subtle.importKey(
    'raw',
    otherPublicKeyRaw,
    ALGORITHM,
    true,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    AES_ALGORITHM,
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return sharedSecret;
}

/** Encrypt message with AES-GCM */
export async function encryptMessage(
  plaintext: string,
  sharedSecret: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedSecret,
    encoder.encode(plaintext)
  );

  return {
    encrypted: base64Encode(new Uint8Array(encrypted)),
    iv: base64Encode(iv),
  };
}

/** Decrypt message with AES-GCM */
export async function decryptMessage(
  encryptedBase64: string,
  ivBase64: string,
  sharedSecret: CryptoKey
): Promise<string> {
  const encrypted = base64Decode(encryptedBase64);
  const iv = base64Decode(ivBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedSecret,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

function generateDeviceId(): string {
  return `device_${crypto.randomUUID()}`;
}
```

---

## Conclusion

This document provides a complete technical plan for implementing E2E encryption in Wallie. The approach balances security, simplicity, and user experience.

**Next Steps:**
1. Review and approve this design
2. Implement Phase 1 (key generation and storage)
3. Test key exchange thoroughly
4. Roll out to beta users for feedback
5. Iterate based on real-world usage

**Questions? Feedback?**
Open an issue or discuss in the team chat.

---

**Last Updated:** November 3, 2025
**Version:** 1.0.0 (Draft)
**Author:** Claude Code
**Status:** Awaiting Review
