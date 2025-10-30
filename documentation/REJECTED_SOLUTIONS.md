# Rejected Solutions

## Overview

This document catalogs technical approaches, libraries, and architectural decisions that were tried but ultimately rejected. This serves as institutional knowledge to prevent repeating failed experiments.

**Format for each entry:**
- **What:** Brief description of what was tried
- **Why we tried it:** The problem we were trying to solve
- **What went wrong:** Why it didn't work
- **What we learned:** Key takeaways
- **Alternative chosen:** What we used instead

---

## Template for New Entries

### [Date] - [Solution Name]

**Category:** [Authentication | Database | UI/UX | Performance | Infrastructure | Other]

**What:**
[Describe the solution that was tried]

**Why we tried it:**
[Describe the problem or goal]

**What went wrong:**
[Describe the issues, bugs, or limitations encountered]

**What we learned:**
[Key insights or lessons]

**Alternative chosen:**
[What solution replaced this one]

**Recommendation:**
[Would you try this again in the future? Under what conditions?]

---

## Example Entries

_The following are placeholder examples to demonstrate the format. Delete these when you add real entries._

---

### 2025-10-15 - Redux for State Management

**Category:** State Management

**What:**
Attempted to use Redux Toolkit for global state management instead of relying solely on Electric-SQL.

**Why we tried it:**
Wanted a familiar state management pattern for handling UI state (modals, form inputs, etc.) separate from database state.

**What went wrong:**
- Added significant bundle size (~40KB)
- Created confusion about whether data should live in Redux or Electric-SQL
- Led to duplicate state in some cases
- Redux DevTools exposed sensitive data (DM content) during development
- Syncing between Redux and Electric-SQL was error-prone

**What we learned:**
- Electric-SQL's reactive queries already provide excellent state management
- UI-only state (modals, etc.) can be handled with React's `useState` or lightweight context
- Don't introduce complexity until you have a clear need

**Alternative chosen:**
- Electric-SQL for all persisted data
- React `useState` + Context API for ephemeral UI state
- Custom hooks for common patterns

**Recommendation:**
Avoid Redux unless you have very specific requirements. The added complexity isn't worth it for most use cases.

---

### 2025-10-20 - Firebase for Authentication

**Category:** Authentication

**What:**
Tried using Firebase Authentication for user management instead of building custom passkey auth.

**Why we tried it:**
Firebase offers easy-to-integrate auth with email/password, OAuth providers, and even passkey support (experimental).

**What went wrong:**
- Firebase requires server-side validation (against our serverless goal)
- User data stored on Google's servers (privacy concern)
- Monthly active user pricing could scale unpredictably
- Vendor lock-in: migrating away from Firebase would be painful
- Passkey support was in beta and poorly documented

**What we learned:**
- Managed auth services trade control for convenience
- For a privacy-first platform, self-hosted auth is essential
- WebAuthn isn't that hard to implement directly

**Alternative chosen:**
- Custom WebAuthn implementation using `@github/webauthn-json`
- Minimal edge functions for challenge/response validation
- User data stays on Arweave and in user's browser

**Recommendation:**
Avoid Firebase or similar services. They conflict with Wallie's core values (privacy, user ownership, cost reduction).

---

### 2025-10-22 - Styled Components for Styling

**Category:** UI/UX

**What:**
Tried using styled-components for CSS-in-JS instead of Tailwind.

**Why we tried it:**
Wanted co-located styles with components and dynamic styling based on props.

**What went wrong:**
- Large runtime overhead (~20KB + React context overhead)
- Slower initial render due to style injection
- Generated class names were hard to debug
- Team found Tailwind faster for prototyping
- No SSR support in our setup caused flash of unstyled content

**What we learned:**
- CSS-in-JS has performance trade-offs that matter at scale
- Tailwind's utility-first approach is faster for iteration
- Co-location can be achieved with component files alongside Tailwind classes

**Alternative chosen:**
- Tailwind CSS exclusively
- Conditional classes via `clsx` or inline logic
- Custom Tailwind plugins for reusable patterns

**Recommendation:**
Stick with Tailwind. CSS-in-JS isn't worth the bundle size and performance cost.

---

## Categories

Use these categories to organize rejected solutions:

- **Authentication** – Login, registration, session management
- **Database** – Data storage, sync, queries
- **State Management** – Global state, caching, reactivity
- **UI/UX** – Styling, components, interactions
- **Performance** – Optimization attempts, caching strategies
- **Infrastructure** – Hosting, deployment, CI/CD
- **Security** – Encryption, validation, hardening
- **Third-Party Services** – APIs, SaaS tools, libraries

---

## Guidelines for Adding Entries

1. **Be honest:** Document failures candidly. This is a learning resource.
2. **Be specific:** Include version numbers, configuration details, error messages.
3. **Be fair:** Some solutions fail due to misuse, not inherent flaws.
4. **Be actionable:** Provide clear recommendations for future decisions.
5. **Update regularly:** Add entries as soon as you abandon an approach (while it's fresh).

---

## When to Add an Entry

Add an entry when:
- You spend more than 4 hours trying an approach before abandoning it
- A library or service is evaluated and rejected
- An architectural decision is reversed
- A performance optimization backfires
- A security approach proves insufficient

Don't add entries for:
- Minor bugs fixed quickly
- Normal debugging/troubleshooting
- Typos or config errors

---

## Archive

If an entry becomes outdated (e.g., a library improves and becomes viable), move it to this section with a note.

### Archived: [Date] - [Solution Name]

**Archived on:** [Date]
**Reason:** [Why this entry is no longer relevant]

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
