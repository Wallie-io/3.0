# Wallie User Stories

## Overview

This document contains user stories for Wallie, organized by feature area. Each story follows the format:

**As a** [user type], **I want to** [action/goal], **so that** [benefit/reason].

Stories are prioritized using MoSCoW:
- **Must Have** – Critical for MVP
- **Should Have** – Important but not critical
- **Could Have** – Nice to have if time permits
- **Won't Have** – Out of scope for current phase

---

## 1. Authentication & Security

### Story 1.1: Passwordless Registration
**Priority:** Must Have
**As a** new user,
**I want to** register using only a passkey (biometric or security key),
**so that** I never have to remember or manage passwords.

**Acceptance Criteria:**
- [ ] User can create account with username only (no email/password required)
- [ ] System generates unique user ID (@username_xxxxx format)
- [ ] Passkey is registered via WebAuthn API
- [ ] User can authenticate on future visits using the same passkey
- [ ] Registration completes in under 30 seconds

**Technical Notes:**
- Use `@github/webauthn-json` for simplified WebAuthn
- Generate user ID: `@${sanitizedUsername}_${6charHash}`
- Store public key in Arweave for profile immutability

---

### Story 1.2: Passkey Login
**Priority:** Must Have
**As a** returning user,
**I want to** log in using my passkey (fingerprint, Face ID, or security key),
**so that** I can securely access my account without typing credentials.

**Acceptance Criteria:**
- [ ] User can initiate login by entering their user ID
- [ ] Browser prompts for passkey authentication
- [ ] Successful authentication creates session
- [ ] Failed authentication shows clear error message
- [ ] Login completes in under 10 seconds

**Technical Notes:**
- Support platform authenticators (Touch ID, Windows Hello, etc.)
- Support roaming authenticators (YubiKey, etc.)
- Session stored in encrypted IndexedDB

---

### Story 1.3: End-to-End Encrypted DMs
**Priority:** Must Have
**As a** user,
**I want to** send direct messages that are encrypted end-to-end,
**so that** no one (including Wallie servers) can read my private conversations.

**Acceptance Criteria:**
- [ ] Messages are encrypted before leaving sender's device
- [ ] Only the recipient can decrypt messages (using their private key)
- [ ] Encryption happens automatically (no user action needed)
- [ ] User sees "Encrypted" indicator in DM interface
- [ ] Keys are generated during registration and never leave the device

**Technical Notes:**
- Use TweetNaCl (X25519 + XSalsa20-Poly1305)
- Public keys stored in Arweave + local DB
- Private keys stored in IndexedDB, encrypted with device key

---

## 2. Core Posting & Feed

### Story 2.1: Create Text Post
**Priority:** Must Have
**As a** user,
**I want to** post text updates to my feed,
**so that** I can share thoughts and updates with my followers.

**Acceptance Criteria:**
- [ ] User can type post (up to 500 characters)
- [ ] Post button is enabled when content is entered
- [ ] Post appears in feed immediately after submission
- [ ] Post syncs to followers' feeds in real-time
- [ ] Character count displayed while typing

**Technical Notes:**
- Insert into Electric-SQL local DB
- Electric syncs to followers automatically
- No server storage required

---

### Story 2.2: Post with Images/Videos
**Priority:** Should Have
**As a** user,
**I want to** attach images or videos to my posts,
**so that** I can share visual content with my followers.

**Acceptance Criteria:**
- [ ] User can upload up to 4 images per post
- [ ] Supported formats: JPG, PNG, WebP, MP4
- [ ] Preview images before posting
- [ ] Images/videos display inline in feed
- [ ] Videos play with native controls

**Technical Notes:**
- Store media on IPFS or CDN
- Store URL references in Electric DB
- Lazy load images in feed

---

### Story 2.3: View Personalized Feed
**Priority:** Must Have
**As a** user,
**I want to** see posts from people I follow and communities I've joined,
**so that** I stay updated on content I care about.

**Acceptance Criteria:**
- [ ] Feed displays posts from followed users
- [ ] Feed includes posts from joined communities
- [ ] Posts sorted by recency with slight engagement weighting
- [ ] Pinned posts always appear at the top
- [ ] Feed updates in real-time as new posts arrive
- [ ] Infinite scroll loads older posts

**Technical Notes:**
- Query local Electric DB for eligible posts
- Live query for real-time updates
- Background pruning of old unpinned posts

---

### Story 2.4: Pin Posts to Save Locally
**Priority:** Must Have
**As a** user,
**I want to** pin posts I care about,
**so that** they persist in my local database and aren't auto-deleted.

**Acceptance Criteria:**
- [ ] Pin icon appears on every post
- [ ] Clicking pin icon marks post as pinned
- [ ] Pinned posts have visual indicator
- [ ] Pinned posts exempt from pruning
- [ ] User can unpin posts
- [ ] Pinned posts viewable in dedicated section

**Technical Notes:**
- Update `pinned: true` in local DB only (not synced)
- Exclude pinned posts from pruning queries

---

### Story 2.5: Threading and Replies
**Priority:** Should Have
**As a** user,
**I want to** reply to posts to start threaded conversations,
**so that** I can engage in discussions.

**Acceptance Criteria:**
- [ ] Reply button on every post
- [ ] Replies displayed nested under parent post
- [ ] Thread depth limited to 3 levels
- [ ] Notification when someone replies to my post
- [ ] View full thread by clicking "View conversation"

**Technical Notes:**
- Store `parentId` in Post model
- Query replies via `post.replies` relation

---

### Story 2.6: Mention Other Users
**Priority:** Should Have
**As a** user,
**I want to** mention other users using @username,
**so that** I can reference or notify them in my posts.

**Acceptance Criteria:**
- [ ] Typing "@" triggers autocomplete
- [ ] Search suggests users by username
- [ ] Mentioned user appears as link
- [ ] Mentioned user receives notification
- [ ] Can mention multiple users in one post

**Technical Notes:**
- Parse mentions from post content
- Store in `Mention` table
- Link to user profile

---

## 3. Profile & Identity

### Story 3.1: Create User Profile
**Priority:** Must Have
**As a** new user,
**I want to** create a profile with username, bio, and avatar,
**so that** others can identify and learn about me.

**Acceptance Criteria:**
- [ ] User can set username (non-unique display name)
- [ ] System assigns unique user ID (@username_xxxxx)
- [ ] User can upload avatar image
- [ ] User can write bio (up to 200 characters)
- [ ] Profile saved to Arweave for persistence

**Technical Notes:**
- Profile stored on Arweave (immutable)
- Cached in Electric DB for quick access
- Avatar stored on IPFS or CDN

---

### Story 3.2: Edit Profile
**Priority:** Should Have
**As a** user,
**I want to** edit my profile (username, bio, avatar),
**so that** I can keep my information up to date.

**Acceptance Criteria:**
- [ ] User can change username (user ID stays the same)
- [ ] User can update bio
- [ ] User can change avatar
- [ ] Changes saved to Arweave as new version
- [ ] Profile history viewable (optional)

**Technical Notes:**
- New Arweave transaction for each update
- Increment profile version number
- Query latest version by `sort: HEIGHT_DESC`

---

### Story 3.3: View Other Profiles
**Priority:** Must Have
**As a** user,
**I want to** view other users' profiles,
**so that** I can learn about them and see their posts.

**Acceptance Criteria:**
- [ ] Click username to open profile
- [ ] Profile shows username, user ID, bio, avatar
- [ ] Profile shows follower/following counts
- [ ] Profile shows recent posts
- [ ] Profile shows "Follow" button (if not following)

**Technical Notes:**
- Fetch profile from local DB first (cached)
- Fallback to Arweave if not in local DB

---

## 4. Direct Messages

### Story 4.1: Send Encrypted DM
**Priority:** Must Have
**As a** user,
**I want to** send a direct message to another user,
**so that** I can have private conversations.

**Acceptance Criteria:**
- [ ] User can search for recipient by username or ID
- [ ] Message input field supports text (up to 1000 chars)
- [ ] Message encrypts automatically before sending
- [ ] Recipient receives message in real-time
- [ ] Both parties see conversation history

**Technical Notes:**
- Encrypt with recipient's public key
- Store encrypted message in Electric DB
- Sync to recipient's device

---

### Story 4.2: View DM Conversations
**Priority:** Must Have
**As a** user,
**I want to** view all my DM conversations in one place,
**so that** I can easily find and continue conversations.

**Acceptance Criteria:**
- [ ] List of conversations sorted by most recent
- [ ] Unread messages have visual indicator
- [ ] Preview last message in each conversation
- [ ] Clicking conversation opens full thread
- [ ] Real-time updates when new messages arrive

**Technical Notes:**
- Query messages table grouped by thread
- Decrypt messages on demand for display

---

## 5. Communities

### Story 5.1: Create Community
**Priority:** Should Have
**As a** user,
**I want to** create a community around a topic,
**so that** I can gather people with shared interests.

**Acceptance Criteria:**
- [ ] User can create community with name and description
- [ ] User becomes community owner/admin
- [ ] Community appears in discovery feed
- [ ] Posts can be made to community
- [ ] Members can join freely

**Technical Notes:**
- Store in Community table
- Creator added as admin in CommunityAdmin table

---

### Story 5.2: Join Community
**Priority:** Should Have
**As a** user,
**I want to** join communities that interest me,
**so that** I can see posts from that community in my feed.

**Acceptance Criteria:**
- [ ] User can browse communities
- [ ] "Join" button on community page
- [ ] After joining, community posts appear in feed
- [ ] User can leave community anytime
- [ ] Joined communities listed in profile

**Technical Notes:**
- Insert record into CommunityMember table
- Feed query includes posts from joined communities

---

### Story 5.3: Community Admin Panel
**Priority:** Could Have
**As a** community admin,
**I want to** manage my community (moderate posts, remove members, add mods),
**so that** I can maintain a healthy community environment.

**Acceptance Criteria:**
- [ ] Admin can view member list
- [ ] Admin can remove members
- [ ] Admin can delete posts
- [ ] Admin can appoint moderators
- [ ] Admin can update community info

**Technical Notes:**
- Check role in CommunityAdmin table
- Only owner/moderator can access admin actions

---

### Story 5.4: Community Sponsorship
**Priority:** Could Have
**As a** community admin,
**I want to** add sponsors to my community,
**so that** the community can be funded without platform-wide ads.

**Acceptance Criteria:**
- [ ] Admin can add sponsor info (name, logo, URL)
- [ ] Sponsor logo displayed in community header
- [ ] Sponsor can post pinned updates (labeled as sponsor)
- [ ] Revenue tracking for sponsor payments
- [ ] Community theme can use sponsor brand colors (optional)

**Technical Notes:**
- Store in Sponsor table linked to Community
- Display sponsor info in community layout

---

## 6. Search & Discovery

### Story 6.1: Search Users
**Priority:** Should Have
**As a** user,
**I want to** search for other users by username or user ID,
**so that** I can find and follow people.

**Acceptance Criteria:**
- [ ] Search bar accepts text input
- [ ] Results show matching usernames and user IDs
- [ ] Results update as user types (debounced)
- [ ] Clicking result opens user profile
- [ ] "Follow" button in search results

**Technical Notes:**
- Query local Electric DB for users
- Fuzzy match on username, exact match on userId

---

### Story 6.2: Search Posts
**Priority:** Could Have
**As a** user,
**I want to** search for posts by keyword,
**so that** I can find content on specific topics.

**Acceptance Criteria:**
- [ ] Search bar accepts keywords
- [ ] Results show posts containing keywords
- [ ] Results sorted by relevance and recency
- [ ] Clicking result opens post
- [ ] Search only covers posts in local DB

**Technical Notes:**
- Full-text search on post content
- Limited to user's local database

---

## 7. Stories (Ephemeral Content)

### Story 7.1: Post Story
**Priority:** Could Have
**As a** user,
**I want to** post a story that disappears after 24 hours,
**so that** I can share temporary moments.

**Acceptance Criteria:**
- [ ] User can upload image/video as story
- [ ] Story visible to followers for 24 hours
- [ ] Story auto-deletes after expiration
- [ ] Story appears in dedicated stories section
- [ ] View count shown to story creator

**Technical Notes:**
- Store in Story table with `expiresAt` timestamp
- Background job deletes expired stories

---

## 8. Notifications

### Story 8.1: Receive Notifications
**Priority:** Should Have
**As a** user,
**I want to** receive notifications for important events (mentions, replies, follows),
**so that** I stay informed about interactions.

**Acceptance Criteria:**
- [ ] Notification icon shows unread count
- [ ] Clicking icon opens notification panel
- [ ] Notifications include: mentions, replies, follows, DMs
- [ ] Clicking notification navigates to relevant content
- [ ] Mark as read/unread

**Technical Notes:**
- Store in Notification table
- Real-time updates via Electric sync

---

## Template for New Stories

### Story X.X: [Feature Name]
**Priority:** [Must Have | Should Have | Could Have | Won't Have]
**As a** [user type],
**I want to** [action],
**so that** [benefit].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Technical Notes:**
- Implementation detail 1
- Implementation detail 2

---

## Story Tracking

Use the following table to track story status during development:

| Story ID | Feature | Priority | Status | Assignee | Milestone |
|----------|---------|----------|--------|----------|-----------|
| 1.1 | Passwordless Registration | Must Have | 📝 Not Started | - | Phase 1 |
| 1.2 | Passkey Login | Must Have | 📝 Not Started | - | Phase 1 |
| 1.3 | E2E Encrypted DMs | Must Have | 📝 Not Started | - | Phase 1 |
| 2.1 | Create Text Post | Must Have | 📝 Not Started | - | Phase 1 |
| 2.3 | View Feed | Must Have | 📝 Not Started | - | Phase 1 |
| 2.4 | Pin Posts | Must Have | 📝 Not Started | - | Phase 1 |
| 3.1 | Create Profile | Must Have | 📝 Not Started | - | Phase 1 |
| 3.3 | View Profiles | Must Have | 📝 Not Started | - | Phase 1 |
| 4.1 | Send Encrypted DM | Must Have | 📝 Not Started | - | Phase 1 |
| 4.2 | View DM Conversations | Must Have | 📝 Not Started | - | Phase 1 |

**Status Legend:**
- 📝 Not Started
- 🔨 In Progress
- ✅ Complete
- ❌ Blocked

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
