# Wallie Platform Architecture

## Executive Summary

Wallie is a **local-first, peer-to-peer social media platform** that eliminates traditional server costs by leveraging browser-based databases and direct client synchronization. Communities fund themselves through sponsorships rather than platform-wide advertising.

**Core Architectural Principles:**
1. **Local-First:** Data lives primarily in the user's browser
2. **Peer-to-Peer Sync:** Direct data synchronization between clients
3. **Selective Persistence:** Users control what data they store
4. **Zero Server Cost:** Static hosting + minimal edge functions
5. **Community-Funded:** Sponsorship model, no platform ads

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  React Router V7 App                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Feed     │  │  Profile   │  │  Encrypted DMs   │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │           Electric-SQL (Local Database)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │  Posts   │  │  Users   │  │ Messages │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │              IndexedDB (Encrypted Keys)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┬───────────┘
                   │                                  │
                   │ Electric Sync Protocol           │ Arweave API
                   │                                  │
         ┌─────────▼────────────┐         ┌──────────▼──────────┐
         │  Electric Sync       │         │    Arweave          │
         │  Server (Optional)   │         │    (Profiles)       │
         │                      │         │                     │
         │  Facilitates P2P     │         │  Immutable storage  │
         └──────────────────────┘         └─────────────────────┘
                   │
                   │ WebSocket/WebRTC
                   │
         ┌─────────▼────────────┐
         │   Other Users'       │
         │   Browsers           │
         └──────────────────────┘
```

---

## Component Architecture

### 1. Frontend Application (React Router V7)

**Deployment:** Static files on CDN (Cloudflare Pages, Vercel, Netlify)

**Structure:**
```
app/
├── routes/
│   ├── _index.tsx                 # Home feed
│   ├── _auth.login.tsx            # Passkey login
│   ├── _auth.register.tsx         # Passkey registration
│   ├── profile.$userId.tsx        # User profiles
│   ├── dm._index.tsx              # DM list
│   ├── dm.$threadId.tsx           # DM conversation
│   ├── post.$postId.tsx           # Individual post view
│   ├── community._index.tsx       # Community discovery
│   ├── community.$id.tsx          # Community page
│   ├── community.$id.admin.tsx    # Community admin panel
│   ├── search.tsx                 # Search interface
│   └── settings.tsx               # User settings
├── components/
│   ├── Post.tsx
│   ├── CommentThread.tsx
│   ├── DMMessage.tsx
│   ├── ProfileCard.tsx
│   └── ...
├── lib/
│   ├── electric.ts                # Database client
│   ├── encryption.ts              # E2EE utilities
│   ├── arweave.ts                 # Arweave integration
│   ├── passkey.ts                 # WebAuthn helpers
│   └── feed-logic.ts              # Feed algorithm
└── root.tsx
```

**Data Flow:**
1. User interaction triggers loader/action in route
2. Route queries Electric-SQL local database
3. Electric-SQL syncs changes with other clients
4. UI updates reactively via Electric's live queries

---

### 2. Local Database (Electric-SQL)

**Technology:** SQLite in browser via wa-sqlite + Electric-SQL sync layer

**Schema:**

```prisma
// Core Models

model User {
  id              String   @id @default(uuid())
  username        String   // Non-unique display name
  userId          String   @unique // Unique identifier (@username_abc123)
  bio             String?
  avatarUrl       String?
  arweaveId       String?  // Reference to Arweave profile
  publicKey       String   // For E2EE
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  posts           Post[]
  sentMessages    Message[] @relation("sender")
  receivedMessages Message[] @relation("recipient")
  communities     CommunityMember[]
  following       Follow[] @relation("follower")
  followers       Follow[] @relation("following")
}

model Post {
  id              String   @id @default(uuid())
  content         String
  authorId        String
  mediaUrls       String[] // Array of image/video URLs
  pinned          Boolean  @default(false) // User pinned (persists locally)
  communityId     String?
  parentId        String?  // For threading
  createdAt       DateTime @default(now())

  author          User      @relation(fields: [authorId], references: [id])
  community       Community? @relation(fields: [communityId], references: [id])
  parent          Post?     @relation("Thread", fields: [parentId], references: [id])
  replies         Post[]    @relation("Thread")
  mentions        Mention[]
}

model Message {
  id              String   @id @default(uuid())
  senderId        String
  recipientId     String
  ciphertext      String   // Encrypted content
  nonce           String   // Encryption nonce
  createdAt       DateTime @default(now())
  read            Boolean  @default(false)

  sender          User @relation("sender", fields: [senderId], references: [id])
  recipient       User @relation("recipient", fields: [recipientId], references: [id])
}

model Community {
  id              String   @id @default(uuid())
  name            String
  description     String
  avatarUrl       String?
  sponsorInfo     Json?    // Sponsor data { name, logoUrl, tier }
  createdAt       DateTime @default(now())

  posts           Post[]
  members         CommunityMember[]
  admins          CommunityAdmin[]
}

model CommunityMember {
  userId          String
  communityId     String
  joinedAt        DateTime @default(now())

  user            User      @relation(fields: [userId], references: [id])
  community       Community @relation(fields: [communityId], references: [id])

  @@id([userId, communityId])
}

model CommunityAdmin {
  userId          String
  communityId     String
  role            String   // "owner" | "moderator"

  @@id([userId, communityId])
}

model Follow {
  followerId      String
  followingId     String
  createdAt       DateTime @default(now())

  follower        User @relation("follower", fields: [followerId], references: [id])
  following       User @relation("following", fields: [followingId], references: [id])

  @@id([followerId, followingId])
}

model Mention {
  postId          String
  userId          String

  post            Post @relation(fields: [postId], references: [id])

  @@id([postId, userId])
}

model Story {
  id              String   @id @default(uuid())
  authorId        String
  mediaUrl        String
  expiresAt       DateTime
  createdAt       DateTime @default(now())
}
```

**Database Lifecycle:**

1. **Initialization:** On first app load
   ```typescript
   const electric = await initElectric()
   await electric.db.raw({ sql: 'PRAGMA cache_size = -10000;' }) // 10MB cache
   ```

2. **Data Ingestion:** Real-time sync from followed users
   ```typescript
   // Subscribe to posts from followed users
   const { results: feed } = db.posts.liveMany({
     where: {
       author: {
         followers: {
           some: {
             followerId: currentUserId
           }
         }
       }
     }
   })
   ```

3. **Pruning:** Background job to remove old unpinned posts
   ```typescript
   async function pruneOldPosts() {
     const threshold = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days

     await db.posts.deleteMany({
       where: {
         pinned: false,
         authorId: { not: currentUserId },
         createdAt: { lt: new Date(threshold) }
       }
     })
   }
   ```

---

### 3. Synchronization Layer (Electric-SQL)

**Architecture:** WebSocket-based real-time sync with optional relay server

**Modes:**

#### A. Peer-to-Peer Direct Sync (Ideal)
- Browsers connect directly via WebRTC
- No intermediary server required
- Limited by NAT traversal

#### B. Relay-Assisted Sync (Fallback)
- Electric sync server facilitates connections
- Minimal server cost (stateless relay)
- Deployed on edge (Cloudflare Workers, Fly.io)

**Sync Protocol:**

1. **Shape Subscription:** Client declares what data they want
   ```typescript
   const shape = await db.posts.sync({
     where: {
       author: {
         followers: {
           some: { followerId: currentUserId }
         }
       }
     }
   })
   ```

2. **Change Propagation:** Local writes broadcast to subscribers
   ```typescript
   // User creates post
   await db.posts.create({
     data: { content: "Hello Wallie!", authorId: currentUserId }
   })
   // Electric automatically syncs to followers' browsers
   ```

3. **Conflict Resolution:** Last-write-wins with vector clocks
   - Each client maintains a logical clock
   - Conflicts resolved deterministically
   - Rare due to append-only social data

**Sync Server Deployment (if needed):**

```dockerfile
# Minimal Electric sync server
FROM electricsql/electric:latest
ENV DATABASE_URL=""  # No persistent DB
ENV ELECTRIC_WRITE_TO_PG_MODE=logical_replication
EXPOSE 5133
```

Deploy on: Fly.io, Railway, or Cloudflare Workers

---

### 4. Feed Algorithm

**Philosophy:** Local-first, user-controlled feed

**Feed Composition:**

```typescript
interface FeedPost {
  post: Post
  reason: 'following' | 'community' | 'pinned' | 'mentioned'
  score: number  // For sorting
}

async function generateFeed(userId: string): Promise<FeedPost[]> {
  const now = Date.now()

  // Get all eligible posts from local DB
  const posts = await db.posts.findMany({
    where: {
      OR: [
        // Pinned posts (always show)
        { pinned: true },

        // Posts from followed users (recent only)
        {
          author: {
            followers: { some: { followerId: userId } }
          },
          createdAt: { gte: getThreshold(7) } // Last 7 days
        },

        // Posts in joined communities
        {
          community: {
            members: { some: { userId } }
          },
          createdAt: { gte: getThreshold(3) } // Last 3 days
        },

        // Posts mentioning user
        {
          mentions: { some: { userId } },
          createdAt: { gte: getThreshold(14) } // Last 14 days
        }
      ]
    },
    include: {
      author: true,
      community: true,
      replies: { take: 3, orderBy: { createdAt: 'desc' } }
    }
  })

  // Score and sort
  return posts
    .map(post => ({
      post,
      reason: determineReason(post, userId),
      score: calculateScore(post, now)
    }))
    .sort((a, b) => b.score - a.score)
}

function calculateScore(post: Post, now: number): number {
  const ageHours = (now - post.createdAt.getTime()) / (1000 * 60 * 60)
  const recencyScore = Math.max(0, 100 - ageHours)

  const engagementScore = post.replies.length * 10

  const pinnedBonus = post.pinned ? 1000 : 0

  return recencyScore + engagementScore + pinnedBonus
}
```

**Key Features:**
- No algorithmic "engagement maximization"
- Chronological with slight recency decay
- User-pinned posts always visible
- Communities can be weighted by user preference

---

### 5. Encrypted Direct Messages (E2EE)

**Encryption Stack:**
- **Algorithm:** XSalsa20-Poly1305 (authenticated encryption)
- **Key Exchange:** X25519 Elliptic Curve Diffie-Hellman
- **Library:** TweetNaCl (NaCl/libsodium port)

**Key Management:**

```typescript
interface UserKeys {
  publicKey: Uint8Array   // Stored on Arweave + local DB
  privateKey: Uint8Array  // Stored ONLY in IndexedDB (encrypted)
  deviceKey: Uint8Array   // Derived from passkey
}

// Generate keys on registration
async function generateUserKeys(userId: string): Promise<UserKeys> {
  const keyPair = nacl.box.keyPair()

  // Derive device key from passkey
  const deviceKey = await deriveKeyFromPasskey(userId)

  // Encrypt private key with device key
  const encryptedPrivateKey = encryptWithDeviceKey(keyPair.secretKey, deviceKey)

  // Store encrypted private key in IndexedDB
  await storeInIndexedDB('userKeys', {
    userId,
    publicKey: keyPair.publicKey,
    encryptedPrivateKey
  })

  // Publish public key to Arweave and Electric DB
  await publishPublicKey(userId, keyPair.publicKey)

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
    deviceKey
  }
}

// Send encrypted message
async function sendEncryptedMessage(
  content: string,
  recipientUserId: string,
  senderKeys: UserKeys
) {
  // Fetch recipient's public key from local DB
  const recipient = await db.users.findUnique({
    where: { userId: recipientUserId }
  })

  const recipientPublicKey = decodePublicKey(recipient.publicKey)

  // Encrypt message
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const messageBytes = new TextEncoder().encode(content)

  const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderKeys.privateKey
  )

  // Store in local DB (syncs to recipient via Electric)
  await db.messages.create({
    data: {
      senderId: senderKeys.userId,
      recipientId: recipientUserId,
      ciphertext: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
      createdAt: new Date()
    }
  })
}

// Receive and decrypt message
async function decryptMessage(
  message: Message,
  recipientKeys: UserKeys
) {
  // Fetch sender's public key
  const sender = await db.users.findUnique({
    where: { id: message.senderId }
  })

  const senderPublicKey = decodePublicKey(sender.publicKey)

  // Decrypt message
  const decrypted = nacl.box.open(
    decodeBase64(message.ciphertext),
    decodeBase64(message.nonce),
    senderPublicKey,
    recipientKeys.privateKey
  )

  if (!decrypted) {
    throw new Error('Failed to decrypt message')
  }

  return new TextDecoder().decode(decrypted)
}
```

**Security Properties:**
- Perfect forward secrecy (can implement with ephemeral keys)
- Authenticated encryption (prevents tampering)
- Private keys never leave device
- No server can read messages

---

### 6. Profile Persistence (Arweave)

**Purpose:** Immutable, censorship-resistant profile storage

**What Gets Stored:**
```typescript
interface ArweaveProfile {
  version: number
  userId: string           // Unique identifier
  username: string         // Display name
  bio: string
  avatarUrl: string        // IPFS or Arweave gateway URL
  publicKey: string        // For E2EE
  metadata: {
    joinedAt: number
    links: { label: string; url: string }[]
  }
  signature: string        // Signed by user's passkey
}
```

**Write Process:**
```typescript
async function saveProfileToArweave(profile: ArweaveProfile) {
  const transaction = await arweave.createTransaction({
    data: JSON.stringify(profile)
  })

  // Add searchable tags
  transaction.addTag('App-Name', 'Wallie')
  transaction.addTag('Content-Type', 'application/json')
  transaction.addTag('Entity-Type', 'profile')
  transaction.addTag('User-ID', profile.userId)
  transaction.addTag('Version', profile.version.toString())

  // Sign and submit
  await arweave.transactions.sign(transaction, userWallet)
  await arweave.transactions.post(transaction)

  // Also update local DB for quick access
  await db.users.update({
    where: { userId: profile.userId },
    data: { arweaveId: transaction.id }
  })

  return transaction.id
}
```

**Read Process:**
```typescript
async function loadProfileFromArweave(userId: string): Promise<ArweaveProfile> {
  // Query for latest profile version
  const query = `
    query {
      transactions(
        tags: [
          { name: "App-Name", values: ["Wallie"] },
          { name: "Entity-Type", values: ["profile"] },
          { name: "User-ID", values: ["${userId}"] }
        ],
        sort: HEIGHT_DESC,
        first: 1
      ) {
        edges {
          node {
            id
          }
        }
      }
    }
  `

  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })

  const { data } = await response.json()
  const txId = data.transactions.edges[0].node.id

  // Fetch transaction data
  const profileData = await arweave.transactions.getData(txId, { decode: true, string: true })

  return JSON.parse(profileData)
}
```

**Cost Optimization:**
- Profiles updated infrequently (Arweave charges per write)
- Use Bundlr for microtransactions if needed
- Cache profiles locally to reduce fetches

---

### 7. Community Sponsorship System

**Model:** Communities self-fund through sponsorships

**Data Structure:**
```typescript
interface Sponsor {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  communityId: string
  activeUntil: Date
  metadata: {
    tagline: string
    color: string  // Brand color for community theme
  }
}

interface CommunityRevenue {
  communityId: string
  sponsors: Sponsor[]
  monthlyRevenue: number
  distributionModel: {
    moderatorShare: number  // Percentage to mods
    creatorFund: number     // Percentage to top creators
    infrastructure: number  // For Electric sync costs
  }
}
```

**Sponsor Integration:**
- Sponsor logo in community header
- Optional branded community theme colors
- Pinned sponsor posts (clearly labeled)
- No tracking/surveillance (privacy-first)

**Revenue Distribution:**
```typescript
async function distributeSponsorRevenue(communityId: string) {
  const community = await db.communities.findUnique({
    where: { id: communityId },
    include: { sponsors: true, members: true }
  })

  const totalRevenue = calculateMonthlyRevenue(community.sponsors)

  const distribution = {
    moderators: totalRevenue * 0.30,  // 30% to mods
    creators: totalRevenue * 0.50,    // 50% to top contributors
    infrastructure: totalRevenue * 0.20  // 20% for costs
  }

  // Distribute via crypto or fiat (implementation depends on payment rails)
}
```

---

## Deployment Architecture

### Static Assets (Frontend)

**Hosting:** Cloudflare Pages, Vercel, Netlify

```bash
# Build production bundle
npm run build

# Output
dist/
├── assets/
│   ├── index-[hash].js     # Main bundle (~200KB gzipped)
│   ├── vendor-[hash].js    # Dependencies (~150KB)
│   └── *.css
├── index.html
└── ...
```

**CDN Configuration:**
- Cache static assets (immutable)
- Gzip/Brotli compression
- HTTP/3 support
- Edge locations globally

---

### Edge Functions (Minimal)

**Use Cases:**
1. Passkey validation (WebAuthn challenge/response)
2. Arweave transaction signing (if using hosted wallet)
3. Rate limiting for abuse prevention
4. Optional search indexing

**Deployment:** Cloudflare Workers, Vercel Edge Functions

**Example Worker:**
```typescript
// Cloudflare Worker for passkey validation
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.url.endsWith('/api/auth/verify')) {
      const { credential } = await request.json()

      // Verify WebAuthn credential
      const isValid = await verifyWebAuthnCredential(credential)

      if (isValid) {
        // Generate session token
        const token = await generateSessionToken(credential.userId)
        return new Response(JSON.stringify({ token }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response('Unauthorized', { status: 401 })
    }

    return new Response('Not found', { status: 404 })
  }
}
```

---

### Electric Sync Server (Optional)

**When Needed:** If P2P WebRTC fails due to NATs

**Deployment:**
- Containerized: Docker on Fly.io or Railway
- Auto-scaling based on concurrent connections
- Stateless (no data persistence)

**Cost:**
- ~$5/month for 10,000 active users (mostly idle)
- Scales linearly with concurrent connections

---

## Data Flow Examples

### Example 1: User Creates a Post

```
1. User types post in UI
   ↓
2. React Router action called
   ↓
3. Insert into local Electric-SQL DB
   db.posts.create({ data: { content, authorId } })
   ↓
4. Electric detects change, broadcasts to shape subscribers
   ↓
5. Followers' browsers receive update via WebSocket
   ↓
6. Followers' local DBs updated automatically
   ↓
7. Followers' UIs re-render with new post (live query)
```

### Example 2: User Sends Encrypted DM

```
1. User types message, clicks send
   ↓
2. Fetch recipient's public key from local DB
   ↓
3. Encrypt message with TweetNaCl
   content → ciphertext + nonce
   ↓
4. Insert into local messages table
   db.messages.create({ senderId, recipientId, ciphertext, nonce })
   ↓
5. Electric syncs encrypted message to recipient's browser
   ↓
6. Recipient's browser receives encrypted message
   ↓
7. Recipient's app fetches their private key from IndexedDB
   ↓
8. Decrypt message using sender's public key + recipient's private key
   ↓
9. Display decrypted message in UI
```

### Example 3: User Pins a Post

```
1. User clicks "pin" icon on post
   ↓
2. Update local DB
   db.posts.update({ where: { id }, data: { pinned: true } })
   ↓
3. Post marked as pinned (won't be pruned)
   ↓
4. Change is LOCAL ONLY (pinning doesn't sync to others)
   ↓
5. Pinned post persists in user's browser indefinitely
```

### Example 4: Community Seeks Sponsor

```
1. Community admin creates sponsorship listing
   ↓
2. Sponsor browses communities, selects one
   ↓
3. Sponsor submits proposal (off-chain negotiation)
   ↓
4. Admin accepts, uploads sponsor data
   db.sponsors.create({ communityId, name, tier, logoUrl })
   ↓
5. Sponsor data syncs to all community members
   ↓
6. Community UI updates with sponsor branding
   ↓
7. Revenue flows via payment rails (Stripe, crypto, etc.)
```

---

## Scalability Considerations

### User Growth
- **10K users:** Single CDN + optional sync relay (~$10/month)
- **100K users:** Multiple sync relays in regions (~$50/month)
- **1M+ users:** P2P prioritized, relay only for NAT traversal (~$200/month)

### Data Growth
- Each user stores ~50MB locally (configurable)
- Old posts auto-pruned unless pinned
- Media stored on IPFS or CDN (users pay for uploads)

### Network Efficiency
- Only sync data for followed users + joined communities
- Compression on sync protocol (gzip)
- Incremental sync (only changes, not full snapshots)

---

## Security Architecture

### Threat Model

**Trusted:**
- User's device and browser
- Arweave network (data integrity)

**Untrusted:**
- Sync relay servers (can be malicious)
- Other users (can be adversarial)
- Network (eavesdropping possible)

**Protections:**

1. **E2EE for DMs:** Messages unreadable by sync relay
2. **Signed Profiles:** Profiles on Arweave are tamper-proof
3. **Local-First:** User controls their data
4. **No Tracking:** No analytics, no surveillance
5. **Passkeys:** Phishing-resistant authentication

---

## Future Architecture Enhancements

### Phase 2: Content Addressing
- Store media on IPFS instead of centralized CDN
- Posts reference content by hash (immutable)

### Phase 3: Token-Curated Communities
- Communities issue tokens for governance
- Token-weighted voting on moderation decisions

### Phase 4: Mesh Networking
- Full P2P with zero relay servers
- WebRTC mesh for ultra-low-latency sync

---

## Monitoring & Observability

### Client-Side Metrics
```typescript
// Local-only analytics (no server tracking)
interface ClientMetrics {
  feedLoadTime: number
  syncLatency: number
  postsInLocalDB: number
  storageUsed: number  // MB
  syncErrors: number
}

// Store in localStorage, display in settings UI
```

### Sync Server Metrics (if deployed)
- Active connections
- Message throughput (msg/sec)
- Error rates
- Resource usage (CPU, memory)

**Tool:** Prometheus + Grafana (self-hosted)

---

## Disaster Recovery

### User Device Loss
1. User logs in with passkey on new device
2. Derives device key from passkey
3. Fetches profile from Arweave
4. Fetches public key, but **private key is lost**
5. User must generate new keypair
6. Previous DMs are **unrecoverable** (by design)

**Solution:** Implement key backup with recovery codes (optional)

### Data Loss (Local DB)
- User's own posts backed up to Arweave (optional premium feature)
- Community posts re-sync from other members
- Pinned posts lost if no backup

---

## Cost Breakdown (1000 Active Users)

| Component              | Cost/Month | Notes                          |
|------------------------|------------|--------------------------------|
| Static Hosting (CDN)   | $0         | Free tier (Cloudflare/Vercel) |
| Edge Functions         | $0-5       | ~100K requests                |
| Electric Sync Relay    | $0-10      | Optional, low traffic         |
| Arweave Storage        | ~$0.50     | ~100 profile updates/month    |
| **Total**              | **~$5**    | Near-zero at scale            |

**At 100K users:** ~$50-100/month (compared to $10K+ for traditional social platforms)

---

## Conclusion

Wallie's architecture achieves **near-zero server costs** through:
1. Local-first data storage (user's browser)
2. Peer-to-peer synchronization (Electric-SQL)
3. Static hosting (CDN-only frontend)
4. Selective persistence (only pinned content stays)
5. Community-funded model (no platform ads)

This enables **truly free social media** without compromising features, privacy, or user experience.

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
