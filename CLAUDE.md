# Wallie 3.0 - React Router v7 Development Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Routing Conventions](#routing-conventions)
4. [Loaders & Actions](#loaders--actions)
5. [Session Management](#session-management)
6. [Styling with Tailwind](#styling-with-tailwind)
7. [Client-Side Operations](#client-side-operations)
8. [Best Practices](#best-practices)

---

## Project Overview

Wallie is a **local-first social network** built with:
- **React Router Framework v7** - File-based routing with type-safe loaders/actions
- **Tailwind CSS v4** - Utility-first styling with custom theme
- **Electric-SQL** - Local-first database with peer-to-peer sync (to be integrated)
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
│   └── session.server.ts     # Cookie session management (server-only)
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

### 1. Type Safety

Always use route types:

```typescript
import type { Route } from "./+types/my-route";

export async function loader({ request, params }: Route.LoaderArgs) {
  // params are typed based on route file name
  const { userId } = params;
}
```

### 2. Error Boundaries

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

### 3. Meta Tags

Export meta function for SEO:

```typescript
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Page Title - Wallie" },
    { name: "description", content: "Page description" }
  ];
}
```

### 4. Form Handling

Use React Router's `<Form>` component (not `<form>`):

```typescript
import { Form } from "react-router";

<Form method="post">
  <input name="email" />
  <button type="submit">Submit</button>
</Form>
```

### 5. Session Management

- Always check auth in protected route loaders
- Use `requireUserId()` to redirect unauthenticated users
- Use `getUserId()` for optional auth checks

### 6. Tailwind Best Practices

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

### 7. File Organization

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
- [Wallie Project Documentation](./documentation/)

---

**Generated for Wallie 3.0 - Local-First Social Network**
