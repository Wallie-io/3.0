# Wallie 3.0

**A local-first social network where you own your data.**

Wallie is a peer-to-peer social platform built on the principle that your data belongs to you. By storing data locally in your browser and syncing directly with peers, Wallie eliminates the need for centralized servers while giving you complete control over your social graph, messages, and content.

## Mission

**Empower users with true data ownership and digital sovereignty.**

We believe social networks should be resilient, private, and user-controlled. Wallie achieves this by:

- **Local-First Architecture** - Your data lives in your browser, accessible offline
- **Peer-to-Peer Sync** - Connect directly with friends without intermediaries
- **End-to-End Encryption** - Private messages stay private
- **Immutable Identity** - Decentralized profiles stored on Arweave
- **Zero Vendor Lock-In** - Export your data anytime, run your own node

## What Wallie Does

- **Social Feed** - Share updates, photos, and thoughts with your network
- **Private Messaging** - End-to-end encrypted conversations
- **Communities** - Create and join interest-based groups with your peers
- **Hangouts/Huddles** - Audio-only and video live sessions with friends and communities
- **Local Data Control** - All content stored in your browser's local database
- **Offline-First** - Use Wallie without an internet connection
- **Peer Discovery** - Find and connect with friends through distributed protocols
- **Profile Permanence** - Your identity lives on Arweave, immune to deplatforming

## Technology Stack

- **React Router v7** - Type-safe routing with server/client loaders and actions
- **Tailwind CSS v4** - Modern, utility-first styling with custom Wallie theme
- **Electric-SQL** *(in progress)* - Local-first database with peer-to-peer sync
- **WebAuthn/Passkeys** *(planned)* - Passwordless authentication
- **Arweave** *(planned)* - Permanent, decentralized profile storage
- **TweetNaCl** *(planned)* - End-to-end encryption for messages

## Development Roadmap

### Phase 1: Foundation ✅
- [x] React Router v7 setup with file-based routing
- [x] Tailwind CSS v4 with custom Wallie theme
- [x] Authentication system (login/signup)
- [x] Dashboard layout (sidebar, topbar, routes)
- [x] Cookie-based session management

### Phase 2: Local-First Database 🚧
- [ ] Integrate Electric-SQL for local data storage
- [ ] Implement client loaders/actions for offline support
- [ ] Design schema for posts, profiles, messages
- [ ] Set up IndexedDB persistence layer
- [ ] Build sync conflict resolution

### Phase 3: Passwordless Auth 📋
- [ ] Implement WebAuthn/Passkey authentication
- [ ] Remove password-based login
- [ ] Add biometric authentication support
- [ ] Device management interface
- [ ] Recovery key system

### Phase 4: Decentralized Identity 📋
- [ ] Integrate Arweave for profile storage
- [ ] Create immutable user profiles
- [ ] Build profile update/versioning system
- [ ] Implement profile discovery mechanism
- [ ] Add profile verification

### Phase 5: End-to-End Encryption 📋
- [ ] Integrate TweetNaCl for message encryption
- [ ] Implement key exchange protocol
- [ ] Build encrypted message storage
- [ ] Add forward secrecy
- [ ] Create key backup/recovery system

### Phase 6: Peer-to-Peer Sync 📋
- [ ] Implement WebRTC for peer connections
- [ ] Build sync protocol for data replication
- [ ] Add conflict-free replicated data types (CRDTs)
- [ ] Create peer discovery mechanism
- [ ] Optimize bandwidth usage

### Phase 7: Communities 📋
- [ ] Design community data structure and schema
- [ ] Build community creation and discovery interface
- [ ] Implement community membership management
- [ ] Add community-specific feeds and posts
- [ ] Create community moderation tools
- [ ] Build community settings and customization
- [ ] Implement community search and filtering

### Phase 8: Hangouts/Huddles 📋
- [ ] Integrate WebRTC for real-time audio/video
- [ ] Build audio-only hangout rooms
- [ ] Add video hangout support with camera toggle
- [ ] Implement peer-to-peer voice/video connections
- [ ] Create hangout room management interface
- [ ] Add screen sharing capabilities
- [ ] Build hangout scheduling and notifications
- [ ] Implement recording and playback (optional)

### Phase 9: Polish & Launch 📋
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsive design refinement
- [ ] User onboarding flow
- [ ] Documentation and guides
- [ ] Beta testing program

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secret-key-here

# Node environment
NODE_ENV=development
```

**Security Note:** Never commit your `.env` file to version control. Always generate a unique `SESSION_SECRET` for each environment.

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

## Project Structure

```
app/
├── lib/
│   ├── utils.ts              # Tailwind utilities (cn function)
│   └── session.server.ts     # Cookie session management
├── routes/
│   ├── _auth.tsx             # Auth layout (login/signup)
│   ├── _auth.login.tsx       # Login page
│   ├── _auth.signup.tsx      # Signup page
│   ├── _dashboard.tsx        # Protected dashboard layout
│   ├── _dashboard._index.tsx # Dashboard home/feed
│   ├── _dashboard.profile.tsx
│   ├── _dashboard.messages._index.tsx
│   ├── _dashboard.messages.$threadId.tsx
│   └── _dashboard.local-data.tsx
├── app.css                   # Tailwind + custom Wallie theme
├── root.tsx                  # Root layout
└── routes.ts                 # Route configuration
```

## Building for Production

Create a production build:

```bash
npm run build
npm start
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete development guide with routing conventions, session management, and best practices
- **[React Router v7 Docs](https://reactrouter.com/dev)** - Official React Router documentation
- **[Tailwind CSS v4 Docs](https://tailwindcss.com/docs)** - Tailwind CSS documentation
- **[Electric-SQL Docs](https://electric-sql.com/docs)** - Local-first database documentation

## Contributing

Wallie is in active development. We welcome contributions! Please see our contributing guidelines (coming soon).

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

**Built with conviction that users deserve to own their data.**
