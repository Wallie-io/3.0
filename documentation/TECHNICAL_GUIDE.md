# Wallie Technical Guide

## Overview
This document defines the core technical stack and development standards for Wallie. **All technical decisions must align with these specifications.**

---

## Core Technology Stack

### 1. Frontend Framework: React Router Framework V7

**Rationale:** React Router Framework V7 provides file-based routing, server-side rendering capabilities, and modern data loading patterns while maintaining React's component model.

**Key Requirements:**
- Use React Router V7's file-based routing convention
- Leverage loaders and actions for data fetching
- Implement proper error boundaries
- Utilize V7's streaming and deferred data features
- Follow V7's component patterns and conventions

**Installation:**
```bash
npx create-react-router@latest
```

**Project Structure:**
```
app/
├── routes/
│   ├── _index.tsx          # Home/Feed
│   ├── profile.$userId.tsx # User profiles
│   ├── dm.$threadId.tsx    # Direct messages
│   └── community.$id.tsx   # Community pages
├── components/
├── lib/
└── root.tsx
```

---

### 2. Styling: Tailwind CSS Only

**Strict Rule:** Tailwind CSS is the **ONLY** styling solution. No CSS-in-JS, styled-components, or custom CSS files (except for Tailwind configuration).

**Configuration:**
- Tailwind comes pre-installed with React Router V7
- Custom utilities must be defined in `tailwind.config.js`
- Use Tailwind's arbitrary values sparingly: `className="mt-[17px]"`
- Leverage Tailwind's design system: spacing scale, color palette, breakpoints

**Best Practices:**
- Component variants via conditional Tailwind classes
- Reusable class combinations via component props
- Dark mode using Tailwind's `dark:` variant
- Responsive design using Tailwind's breakpoint prefixes

**Example:**
```tsx
<div className="bg-wallie-dark border border-wallie-accent/20 rounded-2xl p-6
                hover:border-wallie-accent/40 transition-all duration-200
                dark:bg-wallie-darker dark:border-wallie-accent/10">
  {children}
</div>
```

---

### 3. Local-First Database: Electric-SQL

**Purpose:** Maintain browser-based state with automatic sync between clients, enabling offline-first experiences.

**Architecture:**
- Each user's browser maintains a local SQLite database via Electric-SQL
- Real-time sync between connected clients
- Offline capability with conflict resolution
- No traditional backend database required for social features

**Installation:**
```bash
npm install electric-sql
```

**Key Concepts:**

#### Schema Definition
```typescript
// schema.prisma
model Post {
  id        String   @id
  content   String
  authorId  String
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())

  author    User     @relation(fields: [authorId], references: [id])
}

model User {
  id          String  @id
  username    String  // Non-unique
  userId      String  @unique // Unique identifier (e.g., "@user_abc123")
  posts       Post[]
}
```

#### Database Initialization
```typescript
import { electrify } from 'electric-sql/wa-sqlite'
import { schema } from './generated/client'

export async function initElectric() {
  const electric = await electrify(
    await import('wa-sqlite'),
    schema,
    {
      url: import.meta.env.VITE_ELECTRIC_URL
    }
  )

  return electric
}
```

#### Reactive Queries
```typescript
const { db } = electric
const { results } = db.posts.liveMany({
  where: {
    OR: [
      { pinned: true },
      { createdAt: { gte: getRecentTimeThreshold() } }
    ]
  },
  orderBy: { createdAt: 'desc' }
})
```

**Feed Logic:**
- Feed displays posts currently in local database
- Users can "pin" posts to persist them locally
- Non-pinned posts are periodically pruned to save space
- New posts sync in real-time from connected users

**Data Persistence Rules:**
1. **Always Stored:** User profiles, pinned posts, user's own posts, DMs
2. **Temporarily Stored:** Feed posts from followed users (auto-pruned)
3. **Never Stored:** Posts from unfollowed users, blocked users

---

## Authentication: Passkeys (WebAuthn)

**Standard:** Passwordless authentication using WebAuthn/FIDO2.

**Implementation Strategy:**
```typescript
import { create, get } from '@github/webauthn-json'

// Registration
async function registerPasskey(username: string) {
  const createOptions = await fetch('/api/register/begin', {
    method: 'POST',
    body: JSON.stringify({ username })
  }).then(r => r.json())

  const credential = await create(createOptions)

  const result = await fetch('/api/register/complete', {
    method: 'POST',
    body: JSON.stringify({ username, credential })
  })

  return result
}

// Authentication
async function authenticatePasskey(userId: string) {
  const getOptions = await fetch('/api/login/begin', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }).then(r => r.json())

  const credential = await get(getOptions)

  const session = await fetch('/api/login/complete', {
    method: 'POST',
    body: JSON.stringify({ credential })
  })

  return session
}
```

**Recommended Library:**
- `@github/webauthn-json` - Simplified WebAuthn API
- Server-side: `@simplewebauthn/server` (minimal backend needed)

---

## User Identity System

### Non-Unique Usernames with Unique User IDs

**Display Name:** `username` (non-unique, can be changed)
**Unique Identifier:** `userId` (immutable, string format)

**Format:**
- Username: Any string (e.g., "Jake", "Alex", "Jake")
- User ID: Unique identifier (e.g., "@jake_a1b2c3", "@alex_x9y8z7")

**Examples:**
```
Username: Jake
User ID: @jake_a1b2c3

Username: Jake (another user)
User ID: @jake_d4e5f6
```

**Implementation:**
```typescript
interface UserProfile {
  username: string      // Display name (non-unique)
  userId: string        // Unique identifier (immutable)
  bio: string
  avatar: string
  arweaveProfileId: string  // Reference to Arweave-stored profile
}

// Generate unique user ID during registration
function generateUserId(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '')
  const uniqueSuffix = generateShortHash() // 6-character hash
  return `@${sanitized}_${uniqueSuffix}`
}
```

**Rules:**
- Always display both username and userId in profiles
- Use userId for @mentions, direct links, and references
- Username can be changed; userId cannot
- Search can query both username (fuzzy) and userId (exact)

---

## Data Persistence: Arweave Integration

**Purpose:** Immutable, permanent storage for user profile data.

**What Gets Stored on Arweave:**
- User profile metadata (username, bio, avatar URL, userId)
- Profile update history (append-only log)
- Community information
- Public keys for encryption

**What Stays Local:**
- Posts (unless user explicitly archives)
- DMs (encrypted, local-only)
- Feed data
- Temporary media

**Implementation:**
```typescript
import Arweave from 'arweave'

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
})

async function persistProfileToArweave(profile: UserProfile) {
  const transaction = await arweave.createTransaction({
    data: JSON.stringify(profile)
  })

  transaction.addTag('App-Name', 'Wallie')
  transaction.addTag('Content-Type', 'application/json')
  transaction.addTag('Entity-Type', 'profile')
  transaction.addTag('User-ID', profile.userId)

  await arweave.transactions.sign(transaction)
  await arweave.transactions.post(transaction)

  return transaction.id
}

async function getProfileFromArweave(userId: string) {
  const query = {
    tags: [
      { name: 'App-Name', values: ['Wallie'] },
      { name: 'Entity-Type', values: ['profile'] },
      { name: 'User-ID', values: [userId] }
    ]
  }

  const results = await arweave.arql(query)
  // Get most recent transaction
  const latestTxId = results[0]
  const data = await arweave.transactions.getData(latestTxId, { decode: true })

  return JSON.parse(data)
}
```

---

## Encrypted Direct Messages

**Standard:** End-to-End Encryption (E2EE) using modern cryptography.

**Implementation Strategy:**
- **Key Exchange:** X25519 (Elliptic Curve Diffie-Hellman)
- **Encryption:** XSalsa20-Poly1305 (via TweetNaCl/libsodium)
- **Key Storage:** Browser IndexedDB (encrypted with device key)

**Libraries:**
```bash
npm install tweetnacl tweetnacl-util
```

**Example:**
```typescript
import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'

// Generate key pair for user
function generateKeyPair() {
  return nacl.box.keyPair()
}

// Encrypt message
function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array
) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const messageBytes = new TextEncoder().encode(message)

  const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderPrivateKey
  )

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce)
  }
}

// Decrypt message
function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array
) {
  const decrypted = nacl.box.open(
    decodeBase64(ciphertext),
    decodeBase64(nonce),
    senderPublicKey,
    recipientPrivateKey
  )

  if (!decrypted) throw new Error('Decryption failed')

  return new TextDecoder().decode(decrypted)
}
```

**Key Management:**
- Public keys stored in Arweave (tied to user profile)
- Private keys stored in browser IndexedDB (never leaves device)
- Key rotation supported via profile updates

---

## Development Workflow

### Environment Setup
```bash
# Create new project
npx create-react-router@latest wallie

# Install dependencies
npm install electric-sql tweetnacl arweave @github/webauthn-json

# Run dev server
npm run dev
```

### Code Standards
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with React Router recommended config
- **Formatting:** Prettier with 2-space indentation
- **Imports:** Absolute imports using `~/` prefix

### Testing Strategy
- Unit tests: Vitest
- E2E tests: Playwright
- Focus on critical paths: auth, encryption, sync

---

## Performance Considerations

### Bundle Size
- Code splitting by route (automatic with React Router V7)
- Lazy load heavy dependencies (encryption libs, media viewers)
- Tree-shake unused Tailwind classes (production only)

### Database Performance
- Index frequently queried fields (userId, createdAt, pinned)
- Limit feed queries (e.g., last 100 posts)
- Background sync with Web Workers

### Media Handling
- Lazy load images with `loading="lazy"`
- Use modern formats: WebP, AVIF
- Video streaming via HLS/DASH for larger files

---

## Deployment Strategy

### Static Hosting (Recommended)
- Build static assets: `npm run build`
- Deploy to: Vercel, Netlify, Cloudflare Pages
- CDN distribution for global performance

### Edge Functions (Minimal)
- Passkey validation endpoints
- Arweave transaction signing (if using hosted wallet)
- Rate limiting for public endpoints

### Environment Variables
```bash
VITE_ELECTRIC_URL=     # Electric sync server URL
VITE_ARWEAVE_GATEWAY=  # Arweave gateway (default: arweave.net)
```

---

## Security Checklist

- [ ] All DMs are E2EE (keys never leave browser)
- [ ] Passkeys properly implemented (no password fallback)
- [ ] XSS protection (sanitize user content)
- [ ] CSRF tokens for any server endpoints
- [ ] Content Security Policy headers
- [ ] Secure IndexedDB access (no cross-origin leaks)
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all user data

---

## Forbidden Technologies

To maintain consistency and avoid technical debt:

**DO NOT USE:**
- ❌ CSS Modules, styled-components, Emotion, or any CSS-in-JS
- ❌ Redux, MobX, Zustand (use Electric-SQL for state)
- ❌ GraphQL (Electric handles data sync)
- ❌ Traditional ORMs (Prisma used only for Electric schema)
- ❌ JWT tokens (use passkeys)
- ❌ localStorage for sensitive data (use IndexedDB with encryption)

**USE INSTEAD:**
- ✅ Tailwind CSS (styling)
- ✅ React Router V7 loaders/actions (data fetching)
- ✅ Electric-SQL (state management & sync)
- ✅ Passkeys (authentication)
- ✅ IndexedDB (encrypted local storage)

---

## Migration Path

If deviating from these standards becomes necessary:
1. Document the reason in `REJECTED_SOLUTIONS.md`
2. Propose alternative in team discussion
3. Update this guide if approved
4. Maintain backward compatibility where possible

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
