# Wallie Design System

## Design Philosophy

Wallie's visual identity merges **brutalist boldness** with **refined modernism**, creating an edgy yet approachable aesthetic that stands out in 2025's social media landscape.

**Core Principles:**
1. **Unapologetically Bold** – Strong contrasts, assertive typography, confident interactions
2. **Raw & Honest** – Exposed structure, minimal decoration, authentic user expression
3. **Fluid Depth** – Layered glassmorphism meets sharp edges
4. **Purposeful Motion** – Animations that enhance, never distract
5. **Dark-First** – Optimized for night owls and power users

---

## Color System

### Primary Palette

```css
/* Primary Colors */
--wallie-void: #0A0A0F;        /* Deepest background */
--wallie-dark: #121218;        /* Primary surface */
--wallie-darker: #1A1A24;      /* Elevated surface */
--wallie-slate: #242432;       /* Card background */
--wallie-charcoal: #2D2D40;    /* Hover states */

/* Accent Colors */
--wallie-accent: #00E5FF;      /* Primary accent (cyan) */
--wallie-accent-glow: #00E5FF40; /* Accent with alpha */
--wallie-accent-dim: #00A8CC;  /* Dimmed accent */

/* Secondary Accents */
--wallie-purple: #9D4EDD;      /* Links, special actions */
--wallie-purple-glow: #9D4EDD40;
--wallie-pink: #FF006E;        /* Destructive actions */
--wallie-pink-glow: #FF006E40;

/* Semantic Colors */
--wallie-success: #00F5A0;     /* Success states */
--wallie-warning: #FFD60A;     /* Warnings */
--wallie-error: #FF006E;       /* Errors */

/* Text Colors */
--wallie-text-primary: #FFFFFF;   /* Headlines, key content */
--wallie-text-secondary: #B4B4C8; /* Body text */
--wallie-text-tertiary: #7C7C94;  /* Metadata, timestamps */
--wallie-text-muted: #4A4A5E;     /* Disabled states */
```

### Usage Guidelines

**Backgrounds:**
```tailwind
bg-wallie-void      → Outer app shell, modals overlay
bg-wallie-dark      → Main content area, primary surface
bg-wallie-darker    → Elevated cards, dropdowns
bg-wallie-slate     → Nested content, input fields
bg-wallie-charcoal  → Hover states, active elements
```

**Accents:**
```tailwind
text-wallie-accent    → Primary CTA text, active icons
bg-wallie-accent      → Primary buttons, chips
border-wallie-accent  → Focus states, active borders

text-wallie-purple    → Links, secondary actions
text-wallie-pink      → Delete buttons, alerts
```

**Text Hierarchy:**
```tailwind
text-wallie-text-primary    → H1-H3, usernames, key info
text-wallie-text-secondary  → Paragraphs, descriptions
text-wallie-text-tertiary   → Timestamps, metadata
text-wallie-text-muted      → Placeholder text, disabled
```

---

## Typography

### Font Stack

**Primary Font:** [Inter Variable](https://rsms.me/inter/) (sans-serif)
**Monospace Font:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (for code, IDs)

```css
@import url('https://rsms.me/inter/inter.css');

:root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}

.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}
```

### Type Scale

```css
/* Headings */
--text-display: 3.5rem / 56px   (font-bold, tracking-tight)
--text-h1: 2.5rem / 40px        (font-bold, tracking-tight)
--text-h2: 2rem / 32px          (font-semibold)
--text-h3: 1.5rem / 24px        (font-semibold)
--text-h4: 1.25rem / 20px       (font-medium)

/* Body */
--text-lg: 1.125rem / 18px      (font-normal)
--text-base: 1rem / 16px        (font-normal)  ← Primary body
--text-sm: 0.875rem / 14px      (font-normal)
--text-xs: 0.75rem / 12px       (font-medium)

/* Special */
--text-caption: 0.6875rem / 11px (font-medium, uppercase, tracking-wide)
```

### Tailwind Classes

```tailwind
text-display → text-[56px] font-bold tracking-tight leading-none
text-h1      → text-[40px] font-bold tracking-tight leading-tight
text-h2      → text-[32px] font-semibold leading-snug
text-h3      → text-[24px] font-semibold leading-snug
text-h4      → text-[20px] font-medium

text-lg      → text-lg font-normal
text-base    → text-base font-normal
text-sm      → text-sm font-normal
text-xs      → text-xs font-medium

text-caption → text-[11px] font-medium uppercase tracking-wider
```

### Type Pairing Examples

```html
<!-- Post Card -->
<article>
  <h3 class="text-[20px] font-medium text-wallie-text-primary">@username</h3>
  <p class="text-base text-wallie-text-secondary leading-relaxed">Post content goes here...</p>
  <span class="text-xs text-wallie-text-tertiary">2 hours ago</span>
</article>

<!-- Hero Section -->
<section>
  <h1 class="text-[56px] font-bold tracking-tight text-wallie-text-primary">
    Social media, <span class="text-wallie-accent">unshackled</span>
  </h1>
  <p class="text-lg text-wallie-text-secondary max-w-2xl">
    No ads. No tracking. No server costs. Just pure connection.
  </p>
</section>
```

---

## Shadows & Depth

### Shadow System

Wallie uses **dramatic, multi-layered shadows** for depth, inspired by neomorphism and modern 3D interfaces.

```css
/* Elevation Levels */
--shadow-sm:
  0 1px 2px rgba(0, 0, 0, 0.3),
  0 0 1px rgba(0, 229, 255, 0.1);

--shadow-md:
  0 4px 8px rgba(0, 0, 0, 0.4),
  0 0 2px rgba(0, 229, 255, 0.15),
  inset 0 0 1px rgba(255, 255, 255, 0.05);

--shadow-lg:
  0 10px 25px rgba(0, 0, 0, 0.5),
  0 0 5px rgba(0, 229, 255, 0.2),
  inset 0 0 2px rgba(255, 255, 255, 0.08);

--shadow-xl:
  0 20px 50px rgba(0, 0, 0, 0.6),
  0 0 10px rgba(0, 229, 255, 0.3),
  inset 0 0 3px rgba(255, 255, 255, 0.1);

/* Special: Glow Effect */
--shadow-glow-accent:
  0 0 20px rgba(0, 229, 255, 0.6),
  0 0 40px rgba(0, 229, 255, 0.3);

--shadow-glow-purple:
  0 0 20px rgba(157, 78, 221, 0.6),
  0 0 40px rgba(157, 78, 221, 0.3);
```

### Tailwind Shadow Utilities

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'wallie-sm': '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 229, 255, 0.1)',
        'wallie-md': '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 2px rgba(0, 229, 255, 0.15), inset 0 0 1px rgba(255, 255, 255, 0.05)',
        'wallie-lg': '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 229, 255, 0.2), inset 0 0 2px rgba(255, 255, 255, 0.08)',
        'wallie-xl': '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 3px rgba(255, 255, 255, 0.1)',
        'wallie-glow-accent': '0 0 20px rgba(0, 229, 255, 0.6), 0 0 40px rgba(0, 229, 255, 0.3)',
        'wallie-glow-purple': '0 0 20px rgba(157, 78, 221, 0.6), 0 0 40px rgba(157, 78, 221, 0.3)',
      }
    }
  }
}
```

### Usage Examples

```html
<!-- Floating Card -->
<div class="bg-wallie-darker rounded-2xl shadow-wallie-lg p-6">
  Content
</div>

<!-- Button with Glow -->
<button class="bg-wallie-accent text-wallie-dark font-semibold px-6 py-3 rounded-lg
               shadow-wallie-glow-accent hover:shadow-wallie-xl transition-all">
  Post
</button>

<!-- Modal Overlay -->
<div class="bg-wallie-darker rounded-3xl shadow-wallie-xl p-8">
  Modal content
</div>
```

---

## Glassmorphism

### Glass Effect

Wallie uses **selective glassmorphism** for overlays, modals, and floating elements.

```css
.glass {
  background: rgba(26, 26, 36, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.05);
}

.glass-accent {
  background: rgba(0, 229, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 229, 255, 0.2),
    inset 0 1px 2px rgba(0, 229, 255, 0.1);
}
```

### Tailwind Classes

```tailwind
<!-- Glass Card -->
<div class="bg-wallie-darker/70 backdrop-blur-xl backdrop-saturate-180
            border border-white/10 rounded-2xl shadow-wallie-lg">
  Glassmorphic content
</div>

<!-- Glass Accent -->
<div class="bg-wallie-accent/10 backdrop-blur-xl backdrop-saturate-180
            border border-wallie-accent/20 rounded-xl shadow-wallie-glow-accent/50">
  Highlighted glass element
</div>
```

---

## Border Radius

### Radius Scale

Wallie favors **larger, more dramatic border radii** for a modern, soft-edged brutalist look.

```css
--radius-sm: 0.375rem / 6px     /* Small chips, tags */
--radius-md: 0.5rem / 8px       /* Buttons, inputs */
--radius-lg: 0.75rem / 12px     /* Small cards */
--radius-xl: 1rem / 16px        /* Medium cards */
--radius-2xl: 1.5rem / 24px     /* Large cards, modals */
--radius-3xl: 2rem / 32px       /* Hero elements */
--radius-full: 9999px           /* Pills, avatars */
```

### Usage Guidelines

```html
<!-- Avatar -->
<img class="rounded-full w-12 h-12" />

<!-- Button -->
<button class="rounded-lg px-4 py-2">Click</button>

<!-- Card -->
<article class="rounded-2xl bg-wallie-darker p-6">Card content</article>

<!-- Modal -->
<dialog class="rounded-3xl bg-wallie-slate p-8">Modal</dialog>

<!-- Tag/Chip -->
<span class="rounded-md bg-wallie-charcoal px-2 py-1 text-xs">Tag</span>
```

---

## Spacing System

### Tailwind Spacing

Wallie uses Tailwind's default spacing scale with emphasis on larger gaps for breathing room.

**Common Patterns:**
```tailwind
p-4 / p-6 / p-8    → Card padding (16px / 24px / 32px)
gap-3 / gap-4      → Component spacing (12px / 16px)
space-y-6 / space-y-8 → Vertical rhythm (24px / 32px)
mt-12 / mb-12      → Section breaks (48px)
```

### Layout Grid

```html
<!-- Feed Layout -->
<div class="max-w-3xl mx-auto space-y-6 px-4 py-8">
  <article class="bg-wallie-darker rounded-2xl p-6 space-y-4">...</article>
  <article class="bg-wallie-darker rounded-2xl p-6 space-y-4">...</article>
</div>

<!-- Three Column Layout -->
<div class="grid grid-cols-12 gap-6">
  <aside class="col-span-3">Sidebar</aside>
  <main class="col-span-6">Feed</main>
  <aside class="col-span-3">Widgets</aside>
</div>
```

---

## Component Patterns

### Buttons

```html
<!-- Primary Button -->
<button class="bg-wallie-accent text-wallie-dark font-semibold px-6 py-3 rounded-lg
               shadow-wallie-glow-accent hover:bg-wallie-accent/90 hover:shadow-wallie-xl
               transition-all duration-200 active:scale-[0.98]">
  Post
</button>

<!-- Secondary Button -->
<button class="bg-wallie-charcoal text-wallie-text-primary font-medium px-6 py-3 rounded-lg
               border border-wallie-text-muted hover:border-wallie-accent hover:bg-wallie-slate
               transition-all duration-200">
  Cancel
</button>

<!-- Icon Button -->
<button class="w-10 h-10 rounded-full bg-wallie-charcoal hover:bg-wallie-accent/20
               flex items-center justify-center transition-all duration-200
               hover:shadow-wallie-glow-accent">
  <IconHeart />
</button>

<!-- Destructive Button -->
<button class="bg-wallie-pink text-white font-semibold px-6 py-3 rounded-lg
               shadow-wallie-glow-purple hover:bg-wallie-pink/90
               transition-all duration-200">
  Delete
</button>
```

### Input Fields

```html
<!-- Text Input -->
<input class="w-full bg-wallie-slate text-wallie-text-primary px-4 py-3 rounded-lg
              border border-wallie-charcoal focus:border-wallie-accent focus:ring-2
              focus:ring-wallie-accent/20 outline-none transition-all duration-200
              placeholder:text-wallie-text-muted"
       placeholder="What's on your mind?" />

<!-- Textarea -->
<textarea class="w-full bg-wallie-slate text-wallie-text-primary px-4 py-3 rounded-lg
                 border border-wallie-charcoal focus:border-wallie-accent focus:ring-2
                 focus:ring-wallie-accent/20 outline-none transition-all duration-200
                 resize-none h-32"
          placeholder="Write your post..."></textarea>

<!-- Search Input -->
<div class="relative">
  <input class="w-full bg-wallie-darker text-wallie-text-primary pl-12 pr-4 py-3 rounded-full
                border border-wallie-charcoal focus:border-wallie-accent focus:ring-2
                focus:ring-wallie-accent/20 outline-none transition-all duration-200"
         placeholder="Search Wallie..." />
  <IconSearch class="absolute left-4 top-1/2 -translate-y-1/2 text-wallie-text-tertiary" />
</div>
```

### Cards

```html
<!-- Post Card -->
<article class="bg-wallie-darker rounded-2xl shadow-wallie-md p-6 space-y-4
                hover:shadow-wallie-lg transition-all duration-300
                border border-transparent hover:border-wallie-accent/20">
  <!-- Header -->
  <div class="flex items-center gap-3">
    <img src="/avatar.jpg" class="w-12 h-12 rounded-full" />
    <div class="flex-1">
      <h3 class="text-[16px] font-medium text-wallie-text-primary">@username</h3>
      <p class="text-xs text-wallie-text-tertiary">2 hours ago</p>
    </div>
    <button class="text-wallie-text-muted hover:text-wallie-text-primary">
      <IconMoreHorizontal />
    </button>
  </div>

  <!-- Content -->
  <p class="text-base text-wallie-text-secondary leading-relaxed">
    This is a post on Wallie. No ads, no tracking, just vibes.
  </p>

  <!-- Actions -->
  <div class="flex items-center gap-6 text-wallie-text-tertiary">
    <button class="flex items-center gap-2 hover:text-wallie-accent transition-colors">
      <IconHeart class="w-5 h-5" />
      <span class="text-sm">12</span>
    </button>
    <button class="flex items-center gap-2 hover:text-wallie-purple transition-colors">
      <IconMessageCircle class="w-5 h-5" />
      <span class="text-sm">3</span>
    </button>
    <button class="flex items-center gap-2 hover:text-wallie-success transition-colors">
      <IconShare class="w-5 h-5" />
    </button>
  </div>
</article>

<!-- Profile Card -->
<aside class="bg-wallie-darker rounded-2xl shadow-wallie-lg p-6 space-y-4 sticky top-6">
  <div class="relative">
    <img src="/cover.jpg" class="w-full h-24 rounded-xl object-cover" />
    <img src="/avatar.jpg" class="w-20 h-20 rounded-full border-4 border-wallie-darker
                                   absolute -bottom-10 left-4" />
  </div>

  <div class="pt-12 space-y-2">
    <h2 class="text-[20px] font-semibold text-wallie-text-primary">Jake Wilson</h2>
    <p class="text-sm text-wallie-text-tertiary font-mono">@jake_a1b2c3</p>
    <p class="text-sm text-wallie-text-secondary leading-relaxed">
      Building the future of social media
    </p>
  </div>

  <div class="flex gap-4 text-sm">
    <div>
      <span class="font-semibold text-wallie-text-primary">1.2K</span>
      <span class="text-wallie-text-tertiary ml-1">Following</span>
    </div>
    <div>
      <span class="font-semibold text-wallie-text-primary">3.4K</span>
      <span class="text-wallie-text-tertiary ml-1">Followers</span>
    </div>
  </div>

  <button class="w-full bg-wallie-accent text-wallie-dark font-semibold py-3 rounded-lg
                 shadow-wallie-glow-accent hover:shadow-wallie-xl transition-all">
    Follow
  </button>
</aside>
```

### Navigation

```html
<!-- Top Navigation -->
<nav class="bg-wallie-darker/70 backdrop-blur-xl border-b border-wallie-charcoal/50
            sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="text-[24px] font-bold text-wallie-accent">Wallie</a>

    <!-- Search -->
    <div class="flex-1 max-w-md mx-8">
      <input class="w-full bg-wallie-slate text-wallie-text-primary px-4 py-2 rounded-full
                    border border-wallie-charcoal focus:border-wallie-accent outline-none"
             placeholder="Search..." />
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <button class="w-10 h-10 rounded-full bg-wallie-charcoal hover:bg-wallie-accent/20
                     flex items-center justify-center">
        <IconBell />
      </button>
      <img src="/avatar.jpg" class="w-10 h-10 rounded-full cursor-pointer
                                     ring-2 ring-transparent hover:ring-wallie-accent transition-all" />
    </div>
  </div>
</nav>

<!-- Sidebar Navigation -->
<aside class="w-64 bg-wallie-darker h-screen sticky top-0 p-6 space-y-2">
  <a href="/" class="flex items-center gap-3 px-4 py-3 rounded-lg
                     bg-wallie-accent text-wallie-dark font-medium">
    <IconHome class="w-5 h-5" />
    <span>Home</span>
  </a>
  <a href="/explore" class="flex items-center gap-3 px-4 py-3 rounded-lg
                            text-wallie-text-secondary hover:bg-wallie-charcoal
                            hover:text-wallie-text-primary transition-all">
    <IconCompass class="w-5 h-5" />
    <span>Explore</span>
  </a>
  <a href="/messages" class="flex items-center gap-3 px-4 py-3 rounded-lg
                             text-wallie-text-secondary hover:bg-wallie-charcoal
                             hover:text-wallie-text-primary transition-all">
    <IconMessageCircle class="w-5 h-5" />
    <span>Messages</span>
  </a>
</aside>
```

### Modals

```html
<!-- Modal Overlay -->
<div class="fixed inset-0 bg-wallie-void/80 backdrop-blur-sm z-50
            flex items-center justify-center p-4">
  <!-- Modal Content -->
  <dialog class="bg-wallie-darker rounded-3xl shadow-wallie-xl p-8 max-w-lg w-full
                 border border-wallie-charcoal/50 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-[24px] font-semibold text-wallie-text-primary">Create Post</h2>
      <button class="text-wallie-text-muted hover:text-wallie-text-primary">
        <IconX class="w-6 h-6" />
      </button>
    </div>

    <!-- Content -->
    <textarea class="w-full bg-wallie-slate text-wallie-text-primary px-4 py-3 rounded-lg
                     border border-wallie-charcoal focus:border-wallie-accent outline-none
                     resize-none h-32"
              placeholder="What's on your mind?"></textarea>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button class="px-6 py-3 rounded-lg bg-wallie-charcoal text-wallie-text-primary
                     hover:bg-wallie-slate transition-all">
        Cancel
      </button>
      <button class="px-6 py-3 rounded-lg bg-wallie-accent text-wallie-dark font-semibold
                     shadow-wallie-glow-accent hover:shadow-wallie-xl transition-all">
        Post
      </button>
    </div>
  </dialog>
</div>
```

---

## Animation & Motion

### Transition Durations

```css
--duration-fast: 150ms     /* Micro-interactions (hovers, clicks) */
--duration-base: 200ms     /* Standard transitions */
--duration-slow: 300ms     /* Complex animations, modals */
--duration-slower: 500ms   /* Page transitions, large movements */
```

### Easing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);     /* Default ease */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
--ease-sharp: cubic-bezier(0.4, 0, 1, 1);        /* Sharp exit */
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale Pop */
@keyframes scalePop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Slide In From Right */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Glow Pulse */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.6); }
  50% { box-shadow: 0 0 40px rgba(0, 229, 255, 0.9); }
}
```

### Tailwind Animation Classes

```html
<!-- Fade in on mount -->
<div class="animate-in fade-in slide-in-from-bottom-4 duration-300">Content</div>

<!-- Scale on hover -->
<button class="hover:scale-105 active:scale-95 transition-transform duration-200">
  Click me
</button>

<!-- Smooth color transitions -->
<a class="text-wallie-text-secondary hover:text-wallie-accent transition-colors duration-200">
  Link
</a>

<!-- Complex hover effect -->
<article class="hover:shadow-wallie-lg hover:border-wallie-accent/20
                transition-all duration-300 hover:-translate-y-1">
  Card
</article>
```

---

## Iconography

### Icon System

**Library:** [Lucide Icons](https://lucide.dev/) (React)

**Size Scale:**
```tailwind
w-4 h-4   → 16px (inline icons)
w-5 h-5   → 20px (action buttons)
w-6 h-6   → 24px (primary actions)
w-8 h-8   → 32px (large features)
```

**Usage:**
```tsx
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'

<button className="flex items-center gap-2 text-wallie-text-tertiary
                   hover:text-wallie-accent transition-colors">
  <Heart className="w-5 h-5" />
  <span>Like</span>
</button>
```

---

## Responsive Design

### Breakpoints

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Ultra-wide
    }
  }
}
```

### Mobile-First Patterns

```html
<!-- Stack on mobile, grid on desktop -->
<div class="flex flex-col lg:grid lg:grid-cols-3 gap-6">
  <aside>Sidebar</aside>
  <main class="lg:col-span-2">Feed</main>
</div>

<!-- Hide on mobile, show on desktop -->
<aside class="hidden lg:block">...</aside>

<!-- Responsive padding -->
<div class="px-4 md:px-6 lg:px-8">Content</div>

<!-- Responsive text -->
<h1 class="text-[32px] md:text-[40px] lg:text-[56px] font-bold">Title</h1>
```

---

## Accessibility

### Focus States

```html
<!-- Visible focus ring -->
<button class="focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2
               focus:ring-offset-wallie-dark outline-none">
  Button
</button>

<!-- Focus within container -->
<div class="focus-within:ring-2 focus-within:ring-wallie-accent">
  <input class="outline-none" />
</div>
```

### ARIA Labels

```html
<button aria-label="Like post">
  <Heart className="w-5 h-5" />
</button>

<nav aria-label="Main navigation">...</nav>

<dialog aria-modal="true" role="dialog">...</dialog>
```

### Semantic HTML

```html
<article>  <!-- Not div -->
  <header>
    <h2>Post Title</h2>
  </header>
  <p>Content</p>
  <footer>
    <button>Like</button>
  </footer>
</article>
```

---

## Dark Mode (Default)

Wallie is **dark-first**. Light mode is secondary and should be implemented sparingly.

### Light Mode Adjustments (Optional)

```css
:root[data-theme="light"] {
  --wallie-void: #F5F5F7;
  --wallie-dark: #FFFFFF;
  --wallie-darker: #F0F0F2;
  --wallie-slate: #E8E8EA;
  --wallie-charcoal: #D1D1D6;

  --wallie-text-primary: #000000;
  --wallie-text-secondary: #3C3C43;
  --wallie-text-tertiary: #8E8E93;
}
```

**Recommendation:** Focus on perfecting dark mode before considering light mode.

---

## Performance Considerations

### CSS Optimization

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: { ... },
  plugins: [],
  // Production optimizations
  corePlugins: {
    preflight: true,
  }
}
```

### Loading Strategies

```html
<!-- Lazy load images -->
<img src="/post-image.jpg" loading="lazy" decoding="async" />

<!-- Preload critical assets -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

---

## Design Tokens (Tailwind Config)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        wallie: {
          void: '#0A0A0F',
          dark: '#121218',
          darker: '#1A1A24',
          slate: '#242432',
          charcoal: '#2D2D40',
          accent: '#00E5FF',
          'accent-glow': '#00E5FF40',
          'accent-dim': '#00A8CC',
          purple: '#9D4EDD',
          'purple-glow': '#9D4EDD40',
          pink: '#FF006E',
          'pink-glow': '#FF006E40',
          success: '#00F5A0',
          warning: '#FFD60A',
          error: '#FF006E',
          text: {
            primary: '#FFFFFF',
            secondary: '#B4B4C8',
            tertiary: '#7C7C94',
            muted: '#4A4A5E'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'wallie-sm': '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 229, 255, 0.1)',
        'wallie-md': '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 2px rgba(0, 229, 255, 0.15), inset 0 0 1px rgba(255, 255, 255, 0.05)',
        'wallie-lg': '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 5px rgba(0, 229, 255, 0.2), inset 0 0 2px rgba(255, 255, 255, 0.08)',
        'wallie-xl': '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 3px rgba(255, 255, 255, 0.1)',
        'wallie-glow-accent': '0 0 20px rgba(0, 229, 255, 0.6), 0 0 40px rgba(0, 229, 255, 0.3)',
        'wallie-glow-purple': '0 0 20px rgba(157, 78, 221, 0.6), 0 0 40px rgba(157, 78, 221, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  }
}
```

---

## Brand Assets

### Logo Guidelines

- **Primary Logo:** Wordmark "Wallie" in Inter Bold, cyan (#00E5FF)
- **Icon Logo:** Stylized "W" with glow effect
- **Minimum Size:** 24px height (legibility)
- **Spacing:** Minimum 16px clear space around logo

### Color Usage in Branding

- **Primary Brand Color:** `#00E5FF` (Cyan accent)
- **Secondary:** `#9D4EDD` (Purple)
- **Always on dark backgrounds:** Dark mode is the brand

---

## Examples & References

See `/documentation/design-files/` for:
- Interactive color palette (HTML)
- Live component examples (HTML/CSS)
- Screenshots of reference designs

---

**Last Updated:** 2025-10-30
**Version:** 1.0.0
