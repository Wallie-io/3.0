# Wallie 3.0 - React Router v7 Development Guide

## Project Overview

**Social network** built with React Router v7, Tailwind v4, Day.js, and cookie-based sessions.

**Key Principles:**
- **Tailwind-only** - No custom CSS files
- **Type-safe** - Full TypeScript with route types
- **System theme first** - Follows OS settings

---

## Routing Conventions

**File Naming:**
- `_index.tsx` → `/` (index route)
- `about.tsx` → `/about`
- `users.$id.tsx` → `/users/:id` (dynamic param)
- `_layout.tsx` → Pathless layout (no URL segment)

**Pathless Layouts:** Prefix with `_` (e.g., `_auth.tsx`, `_dashboard.tsx`)

### ⚠️ CRITICAL: Route Registration

**EVERY new route MUST be registered in `app/routes.ts`** or it returns 404.

```typescript
// app/routes.ts
export default [
  layout("routes/_dashboard.tsx", [
    index("routes/_dashboard._index.tsx"),
    route("profile", "routes/_dashboard.profile.tsx"),
  ]),
  route("api/post", "routes/api.post.tsx"),  // API route
] satisfies RouteConfig;
```

**Workflow:** Create file → Register in `routes.ts` → Test

**Route Protection:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request); // Redirects if not auth'd
  return { userId };
}
```

---

## Loaders & Actions

**Server Loaders** (run before render):
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const posts = await db.posts.findMany();
  return { posts, userId };
}
```

**Server Actions** (form submissions):
```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // Validate and process
  return createUserSession({ request, userId, redirectTo: "/" });
}
```

**Client Loaders** (browser-only):
```typescript
export async function clientLoader() {
  const posts = await db.posts.findMany();
  return { posts };
}
clientLoader.hydrate = true;
```

### ⚠️ CRITICAL: Client Actions

**MUST use `useFetcher()` for clientAction, NEVER `<Form>`**

```typescript
// ✅ CORRECT
const fetcher = useFetcher();
fetcher.submit(formData, { method: "post" });

// OR
<fetcher.Form method="post">
  <input name="content" />
  <button type="submit">Post</button>
</fetcher.Form>

// ❌ WRONG
<Form method="post">...</Form>  // Causes "method not allowed"
```

### ⚠️ CRITICAL: Returning JSON

**MUST use `data()` from react-router when returning JSON, NEVER `Response.json()`**

```typescript
import { data } from "react-router";

// ✅ CORRECT
export async function loader() {
  const users = await db.users.findMany();
  return data({ users }, { status: 200 });
}

// ✅ ALSO CORRECT (plain object for simple cases)
export async function loader() {
  const users = await db.users.findMany();
  return { users };
}

// ❌ WRONG
return Response.json({ users });  // Use data() for better type safety
return new Response(JSON.stringify({ users }));  // Use data() instead
```

**API Routes (non-page routes):**
```typescript
// app/routes/api.users.search.tsx
import { data } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  const users = await db.users.search(query);
  return data({ users }, { status: 200 });
}
```

### ⚠️ CRITICAL: Redirects

**Server-side (loaders/actions):**
```typescript
import { redirect } from "react-router";

// ✅ CORRECT
return redirect("/login");

// ❌ WRONG
return Response.redirect("/");  // Causes "Failed to parse URL" error
```

**Client-side:**
```typescript
// Programmatic
const navigate = useNavigate();
navigate("/dashboard");

// Declarative
<Link to="/dashboard">Dashboard</Link>

// Full reload (use sparingly)
window.location.href = "/dashboard";
```

---

## Session Management

Located in `app/lib/session.server.ts`. Set `SESSION_SECRET` env var (generate: `openssl rand -base64 32`).

```typescript
// Create session
await createUserSession({ request, userId, email, redirectTo: "/" });

// Get user (returns null if not logged in)
const userId = await getUserId(request);

// Require auth (redirects to /login if not auth'd)
const userId = await requireUserId(request);

// Logout
await destroySession(request);
```

---


---

## Date Handling with Day.js

Lightweight (2KB) date library. Enable plugin: `dayjs.extend(relativeTime)`.

**Common Formats:**
```typescript
dayjs(date).fromNow()              // "2 hours ago" (social feeds)
dayjs(date).format("h:mm A")       // "10:30 AM" (messages)
dayjs(date).format("MMMM YYYY")    // "January 2025" (profiles)
dayjs(date).format("MMM D, YYYY")  // "Jan 15, 2025" (full dates)
```

---

## Styling with Tailwind

**Tailwind v4** with custom theme in `app/app.css`. Use `cn()` utility from `~/lib/utils` for conditional classes.

**Custom Colors:**
- `bg-wallie-accent` - Primary cyan (#00e5ff)
- `bg-wallie-accent-dim` - Hover state
- `bg-wallie-purple` - Secondary
- `bg-wallie-pink` - Destructive

**Rules:**
- **ONLY Tailwind** - No custom CSS files
- Use `cn()` for conditional/merging classes
- Use `dark:` prefix for dark mode
- Prefer `rounded-lg`, `rounded-xl`

---

## Bento Grid Layout System

**Dashboard uses an adaptive bento grid** for visually dynamic post layouts that maintain balance across breakpoints.

### Overview

The bento grid creates visual intrigue with:
- **Asymmetric column spans** (3-6 cols) on desktop
- **Mixed row heights** (1-3 rows) for variety
- **Dense flow** (`grid-auto-flow: dense`) to fill gaps automatically
- **Adaptive patterns** that adjust per breakpoint (mobile/tablet/desktop)

### Grid Configuration

**File:** `app/routes/_dashboard._index.tsx`

```typescript
// Grid container classes
<div className={cn(
  "grid gap-6 auto-rows-auto",
  "grid-cols-1",                    // Mobile: 1 column
  "md:grid-cols-6",                  // Tablet: 6 columns
  "lg:grid-cols-12 lg:[grid-auto-flow:dense]"  // Desktop: 12 cols + dense flow
)}>
```

### Pattern System

**Predefined patterns cycle** through posts to create balanced asymmetry:

```typescript
const BENTO_PATTERNS: GridPattern[] = [
  // Pattern 0: Large hero (6 cols × 2 rows)
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 6, rowSpan: 2 },
    desktop: { colSpan: 6, rowSpan: 2 },
  },
  // Pattern 1-11: Various sizes (see code for full list)
  // ...
];
```

**Patterns assign to posts using modulo cycling:**
```typescript
const patternIndex = index % BENTO_PATTERNS.length;
const pattern = BENTO_PATTERNS[patternIndex];
```

### How It Works

1. **Posts load chronologically** from the database
2. **First 2 posts are marked "featured"** (larger visual treatment in PostCard)
3. **Each post maps to a pattern** using `index % BENTO_PATTERNS.length`
4. **Pattern defines responsive spans:**
   - Mobile: All posts full-width (1 col)
   - Tablet: 2-6 col spans, 1-2 row spans
   - Desktop: 3-6 col spans, 1-3 row spans
5. **Dense flow fills gaps** left by larger items

### Content Constraints

**PostCards have max-height constraints** to prevent layout breaking:

```typescript
// In PostCard component
<div className={cn(
  'prose prose-invert max-w-none mb-4 overflow-hidden',
  featured ? 'max-h-[400px]' : 'max-h-[200px]'  // Height constraints
)}>
```

**Long content shows "Show more →" link** that navigates to full post detail page (`/posts/:postId`).

### Adding/Modifying Patterns

**To add a new pattern:**

1. Add to `BENTO_PATTERNS` array in `_dashboard._index.tsx`
2. Define column/row spans for all three breakpoints
3. Ensure Tailwind classes are explicitly listed (no dynamic class names!)

**Example:**
```typescript
{
  mobile: { colSpan: 1 },        // Full width on mobile
  tablet: { colSpan: 3, rowSpan: 1 },   // Half width, 1 row on tablet
  desktop: { colSpan: 4, rowSpan: 2 },  // 1/3 width, 2 rows on desktop
}
```

### ⚠️ CRITICAL: Tailwind Class Names

**NEVER use dynamic class names** with Tailwind in the bento grid:

```typescript
// ❌ WRONG - Tailwind can't detect these at build time
`col-span-${pattern.colSpan}`  // Won't work!

// ✅ CORRECT - Use explicit mapping
const colClasses = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
}[pattern.desktop.colSpan];
```

### Key Design Decisions

1. **No widgets in feed** - Only chronological posts for simplicity
2. **Create Post button fixed at top** - Not part of bento flow
3. **Auto row heights** - Content-driven, with max-height constraints
4. **Dense flow on desktop only** - Mobile/tablet use natural order
5. **First 2 posts featured** - Larger visual treatment for recency

### Visual Balance Tips

- **Patterns should vary:** Mix large (6 col), medium (4-5 col), and small (3 col) spans
- **Row heights add rhythm:** Include some 1-row, 2-row, and occasional 3-row spans
- **Test with real content:** Short and long posts should both look good
- **Watch for forced wrapping:** Ensure tablet/desktop patterns don't exceed grid columns

---

## Best Practices Summary

**⚠️ CRITICAL:**
1. **Migrations** - Always add migration when changing schema
2. **Routes** - Register all new routes in `routes.ts`
3. **Client Actions** - Use `useFetcher()`, NEVER `<Form>`
4. **Redirects** - Use `redirect()` from react-router, NEVER `Response.redirect()`
5. **JSON Responses** - Use `data()` from react-router, NEVER `Response.json()`
6. **Git Commits** - NEVER add Claude Code watermarks or co-author tags to commit messages

**Form Handling Decision:**
- Route has `clientAction`? → `useFetcher()`
- Route has server `action` + navigate? → `<Form>`
- Route has server `action` + no navigate? → `useFetcher()`

**Other:**
- Use route types: `import type { Route } from "./+types/my-route"`
- Add error boundaries and meta tags to routes
- Use `requireUserId()` for protected routes
- Consistent Tailwind classes (use `cn()` utility)

---


## Commands

```bash
npm run dev       # Development server
npm run build     # Build for production
npm start         # Production server
npm run typecheck # Type checking
```

## Environment Variables

Create `.env` file:
```env
SESSION_SECRET=your-secret-key-here  # Generate: openssl rand -base64 32
NODE_ENV=development
```

---

**Wallie 3.0 - Social Network**

