# Wallie 3.0 - React Router v7 Development Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Routing Conventions](#routing-conventions)
4. [Loaders & Actions](#loaders--actions)
5. [Redirects](#redirects-in-react-router-v7)
6. [Session Management](#session-management)
7. [Local Database with PGlite](#local-database-with-pglite)
8. [Date Handling with Day.js](#date-handling-with-dayjs)
9. [Styling with Tailwind](#styling-with-tailwind)
10. [Client-Side Operations](#client-side-operations)
11. [Best Practices](#best-practices)
12. [Testing with Playwright](#testing-with-playwright)

---

## Project Overview

Wallie is a **local-first social network** built with:
- **React Router Framework v7** - File-based routing with type-safe loaders/actions
- **Tailwind CSS v4** - Utility-first styling with custom theme
- **PGlite (Electric-SQL)** - Postgres WASM database running entirely in the browser
- **Day.js** - Lightweight date manipulation and formatting library
- **Cookie-based sessions** - Secure authentication with httpOnly cookies

### Key Principles
- **Light mode first** - Dark mode as optional toggle
- **Tailwind-only styling** - No custom CSS files, no CSS-in-JS
- **Type-safe** - Full TypeScript support with route types
- **Local-first** - Data lives in browser, syncs peer-to-peer

---

## File Structure

```
app/
├── lib/
│   ├── utils.ts              # cn() utility for Tailwind class merging
│   ├── session.server.ts     # Cookie session management (server-only)
│   ├── db.client.ts          # PGlite database client and queries
│   ├── sync.client.ts        # Client-side sync utilities
│   └── use-database.ts       # Database initialization hook
├── routes/
│   ├── _auth.tsx             # Pathless layout for auth pages
│   ├── _auth.login.tsx       # Login page with action
│   ├── _auth.signup.tsx      # Signup page with action
│   ├── _dashboard.tsx        # Protected dashboard layout (sidebar + topbar)
│   ├── _dashboard._index.tsx # Dashboard home/feed
│   ├── _dashboard.profile.tsx
│   ├── _dashboard.messages._index.tsx
│   ├── _dashboard.messages.$threadId.tsx
│   └── _dashboard.local-data.tsx  # Client loader/action example
├── app.css                   # Tailwind imports + theme configuration
├── root.tsx                  # Root layout with Meta, Links, Scripts
└── routes.ts                 # Auto-generated routes configuration
```

---

## Routing Conventions

### File Naming Patterns

React Router v7 uses **file-based routing** with special naming conventions:

| File Name | Route Path | Description |
|-----------|------------|-------------|
| `_index.tsx` | `/` | Index route (default child) |
| `about.tsx` | `/about` | Static route segment |
| `users.$id.tsx` | `/users/:id` | Dynamic route parameter |
| `_layout.tsx` | (no path) | Pathless layout (wraps children without URL segment) |
| `_layout._index.tsx` | `/` | Index route nested under layout |
| `blog._index.tsx` | `/blog` | Index route for `/blog` |

### Layout Routes

**Pathless Layouts** (prefix with `_`):
- `_auth.tsx` - Wraps login/signup without adding `/auth` to URL
- `_dashboard.tsx` - Wraps protected routes with sidebar/topbar

**Nested Routes**:
```
_dashboard.tsx                    # Layout with <Outlet />
├── _dashboard._index.tsx         # Renders at "/"
├── _dashboard.profile.tsx        # Renders at "/profile"
└── _dashboard.messages.$id.tsx   # Renders at "/messages/:id"
```

### Route Registration

**CRITICAL: Manual Route Configuration**

Wallie uses **manual route configuration** in `app/routes.ts`. This means:

⚠️ **Every new route file MUST be manually registered** in `routes.ts` or it will return a 404 error.

**Example Registration:**

```typescript
// app/routes.ts
import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Dashboard routes
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("profile", "routes/_dashboard.profile.tsx"),
  ]),

  // API routes (resource routes - no UI component)
  route("api/post", "routes/api.post.tsx"),
] satisfies RouteConfig;
```

**When creating a new route:**

1. ✅ Create the route file (e.g., `app/routes/api.post.tsx`)
2. ✅ **IMMEDIATELY register it in `app/routes.ts`**
3. ✅ Test that the route is accessible (not 404)

**Common Route Types:**

```typescript
// Standard route
route("about", "routes/about.tsx")

// Index route
index("routes/_dashboard._index.tsx")

// Dynamic parameter
route("users/:id", "routes/users.$id.tsx")

// Nested routes in layout
layout("routes/_dashboard.tsx", [
  index("routes/_dashboard._index.tsx"),
  route("profile", "routes/_dashboard.profile.tsx"),
])

// API/Resource route (action/loader only, no component)
route("api/post", "routes/api.post.tsx")
```

### Route Protection

Protected routes use a **loader** to check authentication:

```typescript
// app/routes/_dashboard.tsx
export async function loader({ request }: Route.LoaderArgs) {
  // Redirects to /login if not authenticated
  const userId = await requireUserId(request);
  return { userId };
}
```

---

## Loaders & Actions

### Server Loaders

**Run on the server** before rendering. Used for:
- Fetching data
- Authentication checks
- Redirects

```typescript
// app/routes/_dashboard._index.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  // Fetch data (replace with Electric-SQL)
  const posts = await db.posts.findMany();

  return { posts, userId };
}
```

**Usage in component:**
```typescript
import { useLoaderData } from "react-router";

export default function Home() {
  const { posts } = useLoaderData<typeof loader>();
  return <div>{posts.map(post => ...)}</div>
}
```

### Server Actions

**Run on the server** when forms are submitted. Used for:
- Mutations (create, update, delete)
- Form validation
- Session management

```typescript
// app/routes/_auth.login.tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate
  if (!email || !password) {
    return { error: "Email and password required" };
  }

  // Create session and redirect
  return createUserSession({ request, userId, redirectTo: "/" });
}
```

**Usage in component:**
```typescript
import { Form, useActionData } from "react-router";

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {actionData?.error && <p>{actionData.error}</p>}
      <input name="email" type="email" />
      <button type="submit">Login</button>
    </Form>
  );
}
```

### Client Loaders

**Run in the browser** for local-first operations:

```typescript
// app/routes/_dashboard.local-data.tsx
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  // Access IndexedDB, Electric-SQL, localStorage
  const localPosts = await db.posts.findMany();
  return { localPosts };
}

// Hydrate with server data on first load
clientLoader.hydrate = true;
```

### Client Actions

**Run in the browser** for local mutations:

```typescript
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const content = formData.get("content");

  // Write to local database
  await db.posts.create({ data: { content } });

  // Trigger background sync if online
  if (navigator.onLine) {
    await syncWithPeers();
  }

  return { success: true };
}
```

### Redirects in React Router v7

**CRITICAL: Proper redirect handling in React Router v7**

React Router v7 has specific ways to handle redirects depending on where you are (server vs client).

#### Server-Side Redirects (Loaders & Actions)

**✅ CORRECT - Use `redirect()` from react-router:**

```typescript
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    // Redirect to login with return URL
    return redirect("/login");
  }

  return { userId };
}

export async function action({ request }: Route.ActionArgs) {
  // Process form data...

  // Redirect after success
  return redirect("/dashboard");
}
```

**❌ WRONG - Do NOT use `Response.redirect()`:**

```typescript
// DON'T DO THIS - Will cause "Failed to parse URL" error
return Response.redirect("/");  // ❌ Breaks with relative paths
```

**Redirect with Search Params:**

```typescript
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  if (!userId) {
    const redirectTo = new URL(request.url).pathname;
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    return redirect(`/login?${searchParams}`);
  }

  return { userId };
}
```

**Redirect with Headers (e.g., setting cookies):**

```typescript
import { redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  // Create session with redirect
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
```

#### Client-Side Redirects (Components)

**Option 1: Programmatic Navigation with `useNavigate`:**

```typescript
import { useNavigate } from "react-router";

export default function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate programmatically
    navigate("/dashboard");

    // Navigate with options
    navigate("/login", { replace: true });

    // Navigate with state
    navigate("/profile", { state: { from: "settings" } });
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

**Option 2: Declarative Navigation with `<Link>`:**

```typescript
import { Link } from "react-router";

export default function MyComponent() {
  return (
    <div>
      {/* Basic link */}
      <Link to="/dashboard">Dashboard</Link>

      {/* Link with replace (don't add to history) */}
      <Link to="/login" replace>Login</Link>

      {/* Link with state */}
      <Link to="/profile" state={{ from: "settings" }}>Profile</Link>
    </div>
  );
}
```

**Option 3: Window Location (Full Page Reload):**

```typescript
// Use sparingly - causes full page reload
window.location.href = "/dashboard";

// Or
window.location.assign("/dashboard");
```

#### Common Redirect Patterns

**1. Protected Route Pattern:**

```typescript
// app/routes/_dashboard.tsx
import { redirect } from "react-router";
import { requireUserId } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  // Automatically redirects to /login if not authenticated
  const userId = await requireUserId(request);
  return { userId };
}
```

**2. Post-Login Redirect:**

```typescript
// app/routes/_auth.login.tsx
import { redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const redirectTo = formData.get("redirectTo") || "/";

  // Authenticate user...

  return createUserSession({
    request,
    userId,
    redirectTo: typeof redirectTo === "string" ? redirectTo : "/",
  });
}
```

**3. Conditional Redirect in Loader:**

```typescript
// app/routes/_auth.signup.tsx
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId");

  // If already logged in, redirect to dashboard
  if (userId) {
    return redirect("/");
  }

  return null;
}
```

**4. Client-Side Redirect After API Call:**

```typescript
export default function SignupForm() {
  const navigate = useNavigate();

  const handleSignup = async () => {
    const response = await fetch("/api/signup", { /* ... */ });

    if (response.ok) {
      // Redirect after successful signup
      window.location.href = "/";  // Or use navigate("/")
    }
  };

  return <form onSubmit={handleSignup}>...</form>;
}
```

#### Redirect Best Practices

1. **Always use `redirect()` from react-router in loaders/actions** - Never `Response.redirect()`
2. **Use `navigate()` for programmatic client-side redirects** - Maintains SPA behavior
3. **Use `<Link>` for declarative navigation** - Better accessibility and SEO
4. **Use `window.location.href` only when you need a full page reload** - Like after authentication
5. **Include return URLs for auth redirects** - So users return to their intended page
6. **Use `replace: true` for redirects that shouldn't be in history** - Like successful form submissions

---

## Session Management

### Cookie-based Sessions

Located in `app/lib/session.server.ts` (server-only module).

**Key Functions:**

```typescript
// Create a session after login
await createUserSession({
  request,
  userId: "user123",
  email: "user@example.com",
  redirectTo: "/"
});

// Get user ID from session
const userId = await getUserId(request);
// Returns: string | null

// Require authentication (redirects if not logged in)
const userId = await requireUserId(request);
// Returns: string (or throws redirect)

// Logout (destroy session)
await destroySession(request);
// Redirects to /login
```

**Configuration:**

```typescript
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,           // Prevents XSS
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: NODE_ENV === "production" // HTTPS only in prod
  }
});
```

**Environment Variables:**

Set `SESSION_SECRET` in production:
```bash
openssl rand -base64 32
```

---

## Local Database with PGlite

### Overview

Wallie uses **PGlite** - a WASM Postgres build that runs entirely in the browser with no external dependencies. Data is persisted to IndexedDB and accessible offline.

**Key Features:**
- Full Postgres SQL support in the browser
- Persisted to IndexedDB (`idb://wallie-db`)
- Only 3MB gzipped
- Zero external dependencies
- Works offline

### Database Client

Located in `app/lib/db.client.ts`:

```typescript
import { PGlite } from "@electric-sql/pglite";

// Initialize with IndexedDB persistence
const db = new PGlite("idb://wallie-db");

// Initialize database schema
await initializeDatabase();
```

### Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT FALSE
);

-- Messages and threads (see db.client.ts for full schema)
```

### Common Operations

**Create:**
```typescript
import { createPost, createUser } from "~/lib/db.client";

await createPost(userId, "Hello, Wallie!");
await createUser(userId, "user@example.com");
```

**Query:**
```typescript
import { getAllPosts, getProfileByUserId } from "~/lib/db.client";

const posts = await getAllPosts();
const profile = await getProfileByUserId(userId);
```

**Update:**
```typescript
import { updateProfile } from "~/lib/db.client";

await updateProfile(userId, {
  displayName: "New Name",
  bio: "Updated bio"
});
```

**Raw SQL:**
```typescript
import { db } from "~/lib/db.client";

const result = await db.query(
  "SELECT * FROM posts WHERE author_id = $1",
  [userId]
);
```

### Client Loaders with PGlite

Use `clientLoader` to query the local database:

```typescript
export async function clientLoader() {
  const posts = await getAllPosts();
  return { posts };
}

clientLoader.hydrate = true;
```

### Client Actions with PGlite

Use `clientAction` to mutate local data:

```typescript
export async function clientAction({ request }) {
  const formData = await request.formData();
  const content = formData.get("content");

  await createPost(userId, content);

  return { success: true };
}
```

### User Sync

When users log in, they're automatically synced to the local database:

```typescript
// In _dashboard.tsx layout
useEffect(() => {
  if (userId && email) {
    ensureUserInDatabase(userId, email).catch(console.error);
  }
}, [userId, email]);
```

---

## Date Handling with Day.js

### Overview

Wallie uses **Day.js** for all date manipulation and formatting. It's a lightweight (2KB) alternative to Moment.js with the same API.

**Why Day.js:**
- Only 2KB minified
- Immutable date objects
- Simple, chainable API
- Plugin system for extended functionality

### Installation

Already installed via npm:
```bash
npm install dayjs
```

### Common Usage

**Import and setup:**
```typescript
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Enable relative time plugin
dayjs.extend(relativeTime);
```

**Relative time (recommended for social feeds):**
```typescript
// "2 hours ago", "3 days ago", etc.
const timestamp = dayjs(post.created_at).fromNow();
```

**Format dates:**
```typescript
// Format: "January 2025"
const joined = dayjs(profile.created_at).format("MMMM YYYY");

// Format: "10:30 AM"
const time = dayjs(message.created_at).format("h:mm A");

// Format: "Jan 15, 2025"
const date = dayjs(post.created_at).format("MMM D, YYYY");
```

**Parse dates:**
```typescript
const date = dayjs("2025-01-15");
const timestamp = dayjs(1642291200000);
```

**Manipulate dates:**
```typescript
const tomorrow = dayjs().add(1, "day");
const lastWeek = dayjs().subtract(7, "days");
const startOfMonth = dayjs().startOf("month");
```

**Compare dates:**
```typescript
const isAfter = dayjs(date1).isAfter(date2);
const isBefore = dayjs(date1).isBefore(date2);
const isSame = dayjs(date1).isSame(date2);
```

### Date Formatting Standards

Use these conventions across Wallie:

| Context | Format | Example | Code |
|---------|--------|---------|------|
| Social feed timestamps | Relative | "2 hours ago" | `dayjs(date).fromNow()` |
| Message timestamps | Time only | "10:30 AM" | `dayjs(date).format("h:mm A")` |
| Profile joined date | Month Year | "January 2025" | `dayjs(date).format("MMMM YYYY")` |
| Full dates | Short date | "Jan 15, 2025" | `dayjs(date).format("MMM D, YYYY")` |
| Sync status | Time with seconds | "10:30:45 AM" | `dayjs(date).format("h:mm:ss A")` |

### Available Plugins

Common plugins you might need:

```typescript
// Relative time
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// Custom parse format
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

// UTC support
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

// Timezone support
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);
```

### Examples from Wallie

**Post timestamps:**
```typescript
// app/routes/_dashboard._index.tsx
function formatTimestamp(timestamp: string): string {
  return dayjs(timestamp).fromNow();
}
```

**Profile joined date:**
```typescript
// app/routes/_dashboard.profile.tsx
<p className="text-sm text-gray-500 mt-1">
  Joined {dayjs(profile.created_at).format("MMMM YYYY")}
</p>
```

**Message times:**
```typescript
// app/routes/_dashboard.messages.$threadId.tsx
timestamp: dayjs(msg.created_at).format("h:mm A")
```

---

## Styling with Tailwind

### Theme Configuration

All styling uses **Tailwind CSS v4** with custom theme defined in `app/app.css`:

```css
@theme {
  /* Wallie Color Palette */
  --color-wallie-accent: #00e5ff;      /* Primary cyan */
  --color-wallie-accent-dim: #00a8cc;  /* Hover state */
  --color-wallie-purple: #9d4edd;      /* Secondary */
  --color-wallie-pink: #ff006e;        /* Destructive */

  /* Dark backgrounds (for dark mode toggle) */
  --color-wallie-void: #0a0a0f;
  --color-wallie-dark: #121218;
  --color-wallie-slate: #242432;

  /* Semantic colors */
  --color-wallie-success: #00f5a0;
  --color-wallie-warning: #ffd60a;
  --color-wallie-error: #ff006e;

  /* Text colors */
  --color-wallie-text-primary: #ffffff;
  --color-wallie-text-secondary: #b4b4c8;
}
```

**Usage in components:**

```tsx
<button className="bg-wallie-accent text-white hover:bg-wallie-accent-dim">
  Click me
</button>
```

### cn() Utility Function

Located in `app/lib/utils.ts` - merges Tailwind classes safely:

```typescript
import { cn } from "~/lib/utils";

// Conditional classes
<div className={cn(
  "px-4 py-2 rounded-lg",
  isActive && "bg-wallie-accent",
  "hover:bg-gray-100"
)}>

// Override classes (tailwind-merge handles conflicts)
<button className={cn("p-4", customPadding)}>
  // customPadding="p-2" will override p-4
</button>
```

### Styling Rules

1. **ONLY Tailwind** - No custom CSS files, no styled-components, no emotion
2. **Use cn() utility** - For conditional classes and merging
3. **Light mode first** - Use `dark:` prefix for optional dark mode
4. **Consistent spacing** - Use spacing scale (p-4, gap-6, space-y-4)
5. **Border radius** - Prefer rounded-lg, rounded-xl for modern look

---

## Client-Side Operations

### Local-First with Electric-SQL

**Placeholder pattern** (Electric-SQL not yet integrated):

```typescript
// TODO: Replace with actual Electric-SQL
// import { db } from '~/lib/electric'
// const posts = await db.posts.findMany()

// Mock data for now
const posts = [
  { id: "1", title: "Example" }
];
```

### Client Loader Pattern

```typescript
export async function clientLoader() {
  // Access local database
  const localData = await db.posts.findMany();

  return {
    posts: localData,
    syncStatus: {
      isOnline: navigator.onLine,
      lastSync: new Date(),
      pendingChanges: 0
    }
  };
}

// Enable hydration from server data
clientLoader.hydrate = true;
```

### Offline Support

```typescript
export async function clientAction({ request }) {
  const formData = await request.formData();

  // Write to local database immediately
  await db.posts.create({ data: newPost });

  // Queue sync if offline
  if (!navigator.onLine) {
    await queueSync(newPost);
  } else {
    await syncWithPeers();
  }

  return { success: true };
}
```

---

## Best Practices

### 1. Route Registration (CRITICAL)

⚠️ **ALWAYS register new routes in `app/routes.ts` immediately after creating them.**

```typescript
// app/routes.ts
export default [
  // Add your new route here
  route("api/post", "routes/api.post.tsx"),
] satisfies RouteConfig;
```

Forgetting this step will result in 404 errors. Make it a habit:
1. Create route file → 2. Register in routes.ts → 3. Test

### 2. Redirects (CRITICAL)

⚠️ **ALWAYS use `redirect()` from react-router in loaders/actions, NEVER `Response.redirect()`**

```typescript
// ✅ CORRECT
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  if (!userId) {
    return redirect("/login");  // ✅ Works with relative paths
  }
  return { userId };
}

// ❌ WRONG
export async function loader({ request }: Route.LoaderArgs) {
  if (!userId) {
    return Response.redirect("/login");  // ❌ Causes "Failed to parse URL" error
  }
  return { userId };
}
```

See [Redirects](#redirects-in-react-router-v7) section for complete documentation.

### 3. Type Safety

Always use route types:

```typescript
import type { Route } from "./+types/my-route";

export async function loader({ request, params }: Route.LoaderArgs) {
  // params are typed based on route file name
  const { userId } = params;
}
```

### 4. Error Boundaries

Add error boundaries to routes:

```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Error</h1>
      <p className="text-gray-700">{error.message}</p>
    </div>
  );
}
```

### 5. Meta Tags

Export meta function for SEO:

```typescript
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Page Title - Wallie" },
    { name: "description", content: "Page description" }
  ];
}
```

### 6. Form Handling

**For forms that navigate:** Use `<Form>` component

```typescript
import { Form } from "react-router";

<Form method="post">
  <input name="email" />
  <button type="submit">Submit</button>
</Form>
```

**For forms that DON'T navigate (like API submissions):** Use `useFetcher`

```typescript
import { useFetcher } from "react-router";

const fetcher = useFetcher();

<fetcher.Form method="post" action="/api/post">
  <input name="content" />
  <button type="submit">
    {fetcher.state === "submitting" ? "Posting..." : "Post"}
  </button>
</fetcher.Form>
```

### 7. Session Management

- Always check auth in protected route loaders
- Use `requireUserId()` to redirect unauthenticated users
- Use `getUserId()` for optional auth checks

### 8. Tailwind Best Practices

```tsx
// Good: Consistent spacing, semantic colors
<button className={cn(
  "px-6 py-3 rounded-lg font-medium",
  "bg-wallie-accent text-white",
  "hover:bg-wallie-accent-dim",
  "focus:outline-none focus:ring-2 focus:ring-wallie-accent",
  "transition-colors duration-200"
)}>

// Bad: Inconsistent spacing, magic colors
<button className="px-5 py-2.5 bg-[#00e5ff]">
```

### 9. File Organization

```
app/routes/
├── _auth.tsx                 # Auth layout
├── _auth.login.tsx           # /login
├── _auth.signup.tsx          # /signup
├── _dashboard.tsx            # Dashboard layout
├── _dashboard._index.tsx     # /
├── _dashboard.profile.tsx    # /profile
└── _dashboard.messages.tsx   # /messages
```

---

## Testing with Playwright

### Overview

Wallie uses **Playwright** for end-to-end testing. Playwright provides reliable, fast, and powerful browser automation for testing the entire application flow.

**Key Features:**
- Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-wait for elements to be actionable
- Network interception and mocking
- Screenshot and video recording on failures
- Parallel test execution

### Playwright MCP Integration

**Playwright MCP is available** through Claude Code's MCP server integration. This allows Claude to:
- Write and debug Playwright tests
- Run tests and analyze results
- Take screenshots and recordings
- Interact with the browser during development

The MCP server is configured in `.claude.json` and can be used by Claude to assist with test creation and debugging.

### Test Structure

Tests are located in the `tests/` directory:

```
tests/
├── post-creation.spec.ts    # Post creation flow tests
└── ...                      # Additional test files
```

### Running Tests

```bash
# Run all tests (headless)
npm test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/post-creation.spec.ts

# Run tests in debug mode
npx playwright test --debug
```

### Writing Tests

**Basic test structure:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate and authenticate
    await page.goto('/');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    await page.fill('input[name="content"]', 'Test content');

    // Act
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Common Patterns

**1. Handling Authentication:**

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');

  // Check if login is required
  const loginForm = page.locator('input[name="email"]');
  if (await loginForm.isVisible()) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  }
});
```

**2. Testing Form Submissions (with useFetcher):**

```typescript
test('should submit form without navigation', async ({ page }) => {
  // Fill form
  await page.fill('textarea[name="content"]', 'Test post');

  // Submit
  await page.click('button[type="submit"]:has-text("Post")');

  // Wait for submission state
  await expect(page.locator('button:has-text("Posting...")')).toBeVisible();
  await expect(page.locator('button:has-text("Posting...")')).toBeHidden();

  // Verify success without navigation
  await expect(page).toHaveURL('/'); // URL didn't change
  await expect(page.locator('text=Post created successfully!')).toBeVisible();
});
```

**3. Testing Loading States:**

```typescript
test('should show loading state during submission', async ({ page }) => {
  await page.fill('textarea[name="content"]', 'Test');
  await page.click('button[type="submit"]');

  // Verify disabled state
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await expect(page.locator('textarea[name="content"]')).toBeDisabled();
});
```

**4. Testing Client Loaders (PGlite):**

```typescript
test('should display data from local database', async ({ page }) => {
  await page.goto('/');

  // Wait for client loader to complete
  await page.waitForLoadState('networkidle');

  // Verify data from PGlite is rendered
  await expect(page.locator('article').first()).toBeVisible();
});
```

**5. Testing Empty States:**

```typescript
test('should show empty state when no data exists', async ({ page }) => {
  await page.goto('/');

  const emptyState = page.locator('text=Your feed is empty');
  const items = page.locator('article');

  if (await items.count() === 0) {
    await expect(emptyState).toBeVisible();
  }
});
```

### Configuration

Playwright configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Best Practices

1. **Use descriptive test names** - Start with "should" to describe expected behavior
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Use auto-waiting** - Playwright waits for elements automatically
4. **Test user flows, not implementation** - Focus on what users see and do
5. **Use semantic selectors** - Prefer text content over CSS selectors when possible
6. **Keep tests isolated** - Each test should be independent
7. **Test edge cases** - Empty states, errors, loading states
8. **Use beforeEach for common setup** - DRY principle for test setup

### Debugging Tests

```bash
# Debug mode with Playwright Inspector
npx playwright test --debug

# Run with headed browser to see what's happening
npm run test:headed

# Generate test code by recording interactions
npx playwright codegen http://localhost:5173
```

### CI Integration

For continuous integration, tests run in headless mode with retries:

```yaml
# .github/workflows/test.yml example
- name: Install dependencies
  run: npm ci
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium
- name: Run tests
  run: npm test
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
npm run test:ui
npm run test:headed
```

---

## Environment Variables

Create `.env` file:

```env
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secret-key-here

# Node environment
NODE_ENV=development
```

---

## Next Steps

1. **Integrate Electric-SQL**
   - Install: `npm install electric-sql`
   - Set up local database schema
   - Replace mock data with real queries

2. **Add WebAuthn/Passkeys**
   - Implement passwordless authentication
   - Update login/signup actions

3. **Set up Arweave**
   - Store immutable user profiles
   - Integrate with signup flow

4. **Implement E2EE for Messages**
   - Use TweetNaCl for encryption
   - Encrypt messages before storing locally

---

## Resources

- [React Router v7 Docs](https://reactrouter.com/dev)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Electric-SQL Docs](https://electric-sql.com/docs)
- [Playwright Docs](https://playwright.dev)
- [Day.js Docs](https://day.js.org)
- [Wallie Project Documentation](./documentation/)

---

**Generated for Wallie 3.0 - Local-First Social Network**
