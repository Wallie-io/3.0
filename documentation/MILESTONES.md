# Wallie Development Milestones

## Overview

This document tracks the development roadmap for Wallie, organized into phases. Progress is tracked by milestone, with clear success criteria and dependencies.

**Current Phase:** Phase 1 - Authentication & Security (Priority)

---

## Phase 1: Authentication & Security ⭐ PRIORITY

**Goal:** Establish secure, passwordless authentication and end-to-end encrypted messaging foundation.

**Timeline:** Weeks 1-4
**Status:** 🔨 Not Started

### Objectives

1. ✅ **Passwordless Authentication (Passkeys)**
   - Implement WebAuthn registration flow
   - Implement WebAuthn login flow
   - Test across browsers (Chrome, Safari, Firefox)
   - Test with platform authenticators (Touch ID, Windows Hello, Face ID)
   - Test with roaming authenticators (YubiKey, etc.)

2. ✅ **User Identity System**
   - Non-unique usernames
   - Unique user ID generation (@username_xxxxx)
   - User ID validation and collision prevention
   - Username change support (user ID immutable)

3. ✅ **End-to-End Encrypted DMs**
   - Generate encryption keypairs (X25519)
   - Store public keys on Arweave
   - Store private keys in IndexedDB (encrypted)
   - Implement message encryption (XSalsa20-Poly1305)
   - Implement message decryption
   - Test E2EE between two users

4. ✅ **Profile Persistence (Arweave)**
   - Set up Arweave integration
   - Implement profile upload to Arweave
   - Implement profile retrieval from Arweave
   - Profile versioning system
   - Fallback to local DB when offline

5. ✅ **Security Hardening**
   - Input validation on all user data
   - XSS protection (sanitize user content)
   - CSRF protection for any server endpoints
   - Content Security Policy headers
   - Secure IndexedDB access patterns

### Success Criteria

- [ ] User can register with passkey in under 30 seconds
- [ ] User can login with passkey in under 10 seconds
- [ ] Two users can exchange encrypted DMs that only they can read
- [ ] Private keys never leave the user's device
- [ ] Profile data persists to Arweave and can be retrieved
- [ ] All security checklist items pass

### Dependencies

- React Router Framework V7 setup complete
- Electric-SQL configured and working
- TweetNaCl library integrated
- Arweave SDK integrated

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Passkey browser support limited | High | Provide clear browser compatibility warnings |
| Arweave transaction costs | Medium | Use Bundlr for microtransactions, batch updates |
| IndexedDB storage limits | Medium | Implement storage quota monitoring, warn users |
| Key loss = data loss | High | Implement optional key backup with recovery codes |

---

## Phase 2: Core Social Features

**Goal:** Build essential social media functionality (posts, feed, profiles).

**Timeline:** Weeks 5-8
**Status:** 📝 Not Started

### Objectives

1. ✅ **Posting System**
   - Create text posts (up to 500 chars)
   - Edit posts (optional)
   - Delete posts
   - Post to personal feed
   - Post to communities

2. ✅ **Feed Algorithm**
   - Display posts from followed users
   - Display posts from joined communities
   - Sort by recency with engagement weighting
   - Infinite scroll pagination
   - Real-time updates via Electric sync

3. ✅ **Pin to Save**
   - Pin/unpin posts
   - Pinned posts exempt from pruning
   - Dedicated pinned posts view
   - Visual indicator for pinned posts

4. ✅ **User Profiles**
   - View own profile
   - View other profiles
   - Follow/unfollow users
   - Follower/following counts
   - Recent posts on profile

5. ✅ **Threading & Mentions**
   - Reply to posts
   - Nested thread display (3 levels max)
   - @mention autocomplete
   - @mention notifications
   - View full conversation thread

### Success Criteria

- [ ] User can create and view posts in feed
- [ ] Feed updates in real-time when new posts arrive
- [ ] Pinned posts persist indefinitely
- [ ] User can follow others and see their posts
- [ ] Replies appear nested under parent posts
- [ ] @mentions link to user profiles and trigger notifications

### Dependencies

- Phase 1 complete (authentication working)
- Electric-SQL schema defined for posts, follows, mentions
- Feed algorithm implemented

---

## Phase 3: Media & Rich Content

**Goal:** Support images, videos, and stories.

**Timeline:** Weeks 9-11
**Status:** 📝 Not Started

### Objectives

1. ✅ **Image Uploads**
   - Upload images (JPG, PNG, WebP)
   - Image preview before posting
   - Image optimization (resize, compress)
   - Store on IPFS or CDN
   - Display inline in feed with lazy loading

2. ✅ **Video Support**
   - Upload videos (MP4, WebM)
   - Video thumbnail generation
   - Streaming playback (HLS/DASH)
   - Progress indicator during upload

3. ✅ **Stories**
   - Post ephemeral story (image/video)
   - 24-hour auto-delete
   - Stories section in UI
   - View count for story creator
   - Swipe navigation between stories

4. ✅ **Link Previews**
   - Generate preview for URLs in posts
   - Fetch title, description, image
   - Display as rich card

### Success Criteria

- [ ] User can attach up to 4 images to a post
- [ ] Images display correctly in feed
- [ ] Videos play smoothly inline
- [ ] Stories disappear after 24 hours
- [ ] Link previews render correctly

### Dependencies

- Media storage solution selected (IPFS vs CDN)
- Video transcoding pipeline (if needed)
- Phase 2 complete (posts working)

---

## Phase 4: Communities & Governance

**Goal:** Enable community creation, moderation, and sponsorship.

**Timeline:** Weeks 12-15
**Status:** 📝 Not Started

### Objectives

1. ✅ **Community Creation**
   - Create community with name, description
   - Upload community avatar
   - Set community rules
   - Creator becomes owner/admin

2. ✅ **Community Membership**
   - Browse/discover communities
   - Join/leave communities
   - Community posts appear in feed
   - Member list view

3. ✅ **Community Moderation**
   - Admin panel for community owners
   - Remove members
   - Delete posts
   - Appoint moderators
   - Ban users from community

4. ✅ **Sponsorship System**
   - Add sponsor to community
   - Display sponsor logo in community header
   - Sponsor pinned posts (labeled)
   - Revenue tracking
   - Optional sponsor-themed community colors

5. ✅ **Community Discovery**
   - Browse trending communities
   - Search communities by keyword
   - Recommended communities based on interests

### Success Criteria

- [ ] User can create and manage a community
- [ ] Communities appear in discovery feed
- [ ] Admins can moderate effectively
- [ ] Sponsors can be added with visible branding
- [ ] Community posts sync to all members

### Dependencies

- Phase 2 complete (profiles, posts working)
- Community schema in Electric-SQL
- Admin permission system

---

## Phase 5: Search & Discovery

**Goal:** Implement robust search for users, posts, and communities.

**Timeline:** Weeks 16-18
**Status:** 📝 Not Started

### Objectives

1. ✅ **User Search**
   - Search by username (fuzzy match)
   - Search by user ID (exact match)
   - Autocomplete suggestions
   - Results with follow buttons

2. ✅ **Post Search**
   - Full-text search on post content
   - Filter by date, author, community
   - Results sorted by relevance

3. ✅ **Community Search**
   - Search by name/description
   - Filter by size, activity
   - Tag-based search

4. ✅ **Trending & Recommendations**
   - Trending posts (local algorithm)
   - Recommended users to follow
   - Recommended communities

### Success Criteria

- [ ] User can search and find other users
- [ ] Post search returns relevant results
- [ ] Community search helps discovery
- [ ] Trending section shows popular content

### Dependencies

- Full-text search implementation in Electric-SQL
- Algorithm for trending calculation

---

## Phase 6: Notifications & Real-Time Updates

**Goal:** Keep users informed with timely notifications.

**Timeline:** Weeks 19-20
**Status:** 📝 Not Started

### Objectives

1. ✅ **In-App Notifications**
   - Notification panel in UI
   - Unread count indicator
   - Notification types: mention, reply, follow, DM
   - Mark as read/unread
   - Clear all notifications

2. ✅ **Push Notifications (Optional)**
   - Browser push notifications (Web Push API)
   - Opt-in notification preferences
   - Notification for DMs, mentions

3. ✅ **Real-Time Indicators**
   - Online/offline status
   - Typing indicators in DMs
   - "User is viewing" in DMs

### Success Criteria

- [ ] Notifications appear in real-time
- [ ] User can manage notification preferences
- [ ] Push notifications work when browser is open

### Dependencies

- Notification schema in Electric-SQL
- Web Push API integration (optional)

---

## Phase 7: Mobile Optimization & PWA

**Goal:** Ensure excellent mobile experience and offline functionality.

**Timeline:** Weeks 21-23
**Status:** 📝 Not Started

### Objectives

1. ✅ **Responsive Design**
   - Mobile-first layouts
   - Touch-friendly interactions
   - Bottom navigation on mobile
   - Swipe gestures

2. ✅ **Progressive Web App**
   - Service worker for offline caching
   - Install prompt for home screen
   - Offline mode for viewing cached content
   - Background sync for pending posts

3. ✅ **Performance Optimization**
   - Code splitting per route
   - Image lazy loading
   - Virtual scrolling for long feeds
   - Bundle size < 300KB gzipped

### Success Criteria

- [ ] App works smoothly on mobile devices
- [ ] Installable as PWA on iOS and Android
- [ ] Offline mode allows viewing cached posts
- [ ] Lighthouse score > 90 on mobile

### Dependencies

- Service worker setup
- PWA manifest configuration

---

## Phase 8: Polish & Launch Prep

**Goal:** Final touches, testing, and launch preparation.

**Timeline:** Weeks 24-26
**Status:** 📝 Not Started

### Objectives

1. ✅ **Testing & QA**
   - E2E tests for critical flows
   - Cross-browser testing
   - Performance testing
   - Security audit

2. ✅ **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus indicators

3. ✅ **Documentation**
   - User guide
   - FAQ
   - Privacy policy
   - Terms of service

4. ✅ **Monitoring & Analytics**
   - Error tracking (client-side only, privacy-preserving)
   - Performance monitoring
   - Usage metrics (local, not sent to server)

5. ✅ **Launch Readiness**
   - Deploy to production
   - Set up CDN
   - Configure edge functions
   - Deploy Electric sync relay (if needed)

### Success Criteria

- [ ] All critical bugs fixed
- [ ] Accessibility audit passes
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Launch announcement prepared

---

## Future Phases (Post-Launch)

### Phase 9: Advanced Features
- Token-gated communities
- NFT profile pictures
- Decentralized identity (DIDs)
- Cross-platform sync (desktop app)

### Phase 10: Scaling & Optimization
- WebRTC mesh networking (full P2P)
- IPFS integration for all media
- Improved feed algorithm with ML
- Multi-device sync improvements

---

## Progress Tracking

### Overall Progress

| Phase | Status | Start Date | End Date | Completion |
|-------|--------|------------|----------|------------|
| Phase 1: Auth & Security | 📝 Not Started | TBD | TBD | 0% |
| Phase 2: Core Social | 📝 Not Started | TBD | TBD | 0% |
| Phase 3: Media & Rich Content | 📝 Not Started | TBD | TBD | 0% |
| Phase 4: Communities | 📝 Not Started | TBD | TBD | 0% |
| Phase 5: Search & Discovery | 📝 Not Started | TBD | TBD | 0% |
| Phase 6: Notifications | 📝 Not Started | TBD | TBD | 0% |
| Phase 7: Mobile & PWA | 📝 Not Started | TBD | TBD | 0% |
| Phase 8: Polish & Launch | 📝 Not Started | TBD | TBD | 0% |

**Status Legend:**
- 📝 Not Started
- 🔨 In Progress
- ✅ Complete
- ⚠️ Blocked
- 🚀 Launched

---

## Key Metrics

Track these metrics to measure progress and success:

### Technical Metrics
- [ ] Test coverage > 80%
- [ ] Bundle size < 300KB gzipped
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90
- [ ] Zero critical security vulnerabilities

### User Experience Metrics
- [ ] Registration flow < 30 seconds
- [ ] Login flow < 10 seconds
- [ ] Feed load time < 2 seconds
- [ ] DM send latency < 500ms
- [ ] Offline mode functional

### Launch Metrics (Post-Launch)
- [ ] 1,000 registered users (Month 1)
- [ ] 100 active communities (Month 2)
- [ ] 10,000 posts created (Month 3)
- [ ] User retention > 40% (Day 7)

---

## Decision Log

Use this section to record major decisions and their rationale.

### Decision 2025-10-30: Prioritize Authentication First
**Decision:** Focus Phase 1 entirely on auth & security before social features.
**Rationale:** Foundation of trust must be rock-solid. Passkeys and E2EE are differentiators.
**Impact:** Delays post creation by 4 weeks, but ensures security from day one.

### Decision [Date]: [Title]
**Decision:** [What was decided]
**Rationale:** [Why this decision was made]
**Impact:** [How this affects timeline, features, or architecture]

---

## Retrospectives

After each phase, conduct a retrospective and document learnings.

### Phase 1 Retrospective (TBD)
**What went well:**
- TBD

**What could be improved:**
- TBD

**Action items:**
- TBD

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
