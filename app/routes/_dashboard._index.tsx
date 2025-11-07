import { Link, useLoaderData, useRevalidator } from "react-router";
import { useEffect, useMemo } from "react";
import type { Route } from "./+types/_dashboard._index";
import { getUserId } from "~/lib/session.server";
import { getTopLevelPostsWithStats } from "~/db/services/posts";
import { PostCard } from "~/components/PostCard";
import { cn } from "~/lib/utils";
import type { PostWithStats } from "~/db/services/posts";

// ============================================================================
// Types
// ============================================================================

type GridItemType = 'post' | 'trending' | 'suggested';

interface GridItem {
  type: GridItemType;
  post?: PostWithStats;
  featured?: boolean;
}

interface GridPattern {
  // Mobile (1 column)
  mobile: {
    colSpan: number;
  };
  // Tablet (6 columns)
  tablet: {
    colSpan: number;
    rowSpan: number;
  };
  // Desktop (12 columns)
  desktop: {
    colSpan: number;
    rowSpan: number;
  };
}

// ============================================================================
// Bento Grid Pattern System
// ============================================================================

/**
 * Adaptive pattern definitions for asymmetric bento grid
 * Pattern cycles through posts and widgets to create visual intrigue
 * while maintaining balance across breakpoints.
 *
 * Desktop: 12 columns, asymmetric spans (3-6 cols), mixed heights (1-3 rows)
 * Tablet: 6 columns, simpler spans (2-3 cols), 1-2 rows
 * Mobile: 1 column, full-width stacking
 */
const BENTO_PATTERNS: GridPattern[] = [
  // Pattern 0: Large hero (first post)
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 6, rowSpan: 2 },
    desktop: { colSpan: 6, rowSpan: 2 },
  },
  // Pattern 1: Medium featured (second post)
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 2 },
    desktop: { colSpan: 6, rowSpan: 2 },
  },
  // Pattern 2: Widget or post (Trending widget ideally)
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 2 },
    desktop: { colSpan: 4, rowSpan: 2 },
  },
  // Pattern 3: Medium post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 5, rowSpan: 1 },
  },
  // Pattern 4: Small post or widget
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 3, rowSpan: 1 },
  },
  // Pattern 5: Tall post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 2, rowSpan: 2 },
    desktop: { colSpan: 4, rowSpan: 3 },
  },
  // Pattern 6: Wide post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 4, rowSpan: 1 },
    desktop: { colSpan: 5, rowSpan: 1 },
  },
  // Pattern 7: Small widget or post (Suggested users)
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 2, rowSpan: 1 },
    desktop: { colSpan: 3, rowSpan: 2 },
  },
  // Pattern 8: Regular post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 4, rowSpan: 1 },
  },
  // Pattern 9: Medium post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 5, rowSpan: 2 },
  },
  // Pattern 10: Regular post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 4, rowSpan: 1 },
  },
  // Pattern 11: Small post
  {
    mobile: { colSpan: 1 },
    tablet: { colSpan: 3, rowSpan: 1 },
    desktop: { colSpan: 3, rowSpan: 1 },
  },
];

/**
 * Server Loader: Get user ID from session and fetch posts from database
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);

  try {
    const posts = await getTopLevelPostsWithStats(userId || undefined);
    return { userId, posts };
  } catch (error) {
    console.error("Error loading posts:", error);
    return { userId, posts: [] };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - Wallie" },
    { name: "description", content: "Your local-first social feed" },
  ];
}

export default function DashboardHome() {
  const { userId, posts } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Poll for new posts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (revalidator.state === 'idle') {
        revalidator.revalidate();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [revalidator]);

  // Create grid items array - just posts in chronological order
  const gridItems = useMemo<GridItem[]>(() => {
    if (!posts || posts.length === 0) return [];

    // First two posts are featured (larger in the bento grid)
    return posts.map((post, index) => ({
      type: 'post' as GridItemType,
      post,
      featured: index < 2, // First two posts are featured
    }));
  }, [posts]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Create Post Button - Fixed at top, not part of bento flow */}
      <div className="mb-6">
        <Link
          to="/posts/new"
          className="block bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6 transition-all hover:border-wallie-accent/30 hover:shadow-wallie-xl"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-wallie-accent to-wallie-purple flex items-center justify-center text-gray-900 font-bold">
              {userId ? 'U' : '?'}
            </div>
            <div className="flex-1">
              <p className="text-lg text-wallie-text-tertiary">What's on your mind?</p>
            </div>
            <button className={cn(
              "px-6 py-3 rounded-lg font-semibold",
              "bg-wallie-accent text-wallie-dark",
              "shadow-wallie-glow-accent",
              "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
              "transition-all duration-200",
              "active:scale-[0.98]"
            )}>
              Create Post
            </button>
          </div>
        </Link>
      </div>

      {/* Bento Grid Container with adaptive patterns */}
      {posts.length === 0 ? (
        <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wallie-accent to-wallie-purple flex items-center justify-center shadow-wallie-glow-accent">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h3 className="text-[24px] font-bold text-wallie-text-primary">
                Your feed is empty
              </h3>
              <p className="text-wallie-text-secondary leading-relaxed">
                Start sharing your thoughts with the world! Create your first post above to get started.
              </p>
            </div>

            {/* Decorative element */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="w-2 h-2 rounded-full bg-wallie-accent animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-wallie-purple animate-pulse" style={{ animationDelay: "75ms" }} />
              <div className="w-2 h-2 rounded-full bg-wallie-pink animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 auto-rows-auto",
          // Mobile: 1 column, simple stacking
          "grid-cols-1",
          // Tablet: 6 columns
          "md:grid-cols-6",
          // Desktop: 12 columns with dense flow to fill gaps
          "lg:grid-cols-12 lg:[grid-auto-flow:dense]"
        )}>
          {gridItems.map((item, index) => {
            if (item.type !== 'post' || !item.post) return null;

            // Get pattern for this item (cycles through BENTO_PATTERNS)
            const patternIndex = index % BENTO_PATTERNS.length;
            const pattern = BENTO_PATTERNS[patternIndex];

            // Map pattern values to explicit Tailwind classes
            const mobileClasses = pattern.mobile.colSpan === 1 ? 'col-span-1' : 'col-span-full';

            const tabletColClasses = {
              2: 'md:col-span-2',
              3: 'md:col-span-3',
              4: 'md:col-span-4',
              6: 'md:col-span-6',
            }[pattern.tablet.colSpan] || 'md:col-span-3';

            const tabletRowClasses = {
              1: 'md:row-span-1',
              2: 'md:row-span-2',
            }[pattern.tablet.rowSpan] || 'md:row-span-1';

            const desktopColClasses = {
              3: 'lg:col-span-3',
              4: 'lg:col-span-4',
              5: 'lg:col-span-5',
              6: 'lg:col-span-6',
            }[pattern.desktop.colSpan] || 'lg:col-span-4';

            const desktopRowClasses = {
              1: 'lg:row-span-1',
              2: 'lg:row-span-2',
              3: 'lg:row-span-3',
            }[pattern.desktop.rowSpan] || 'lg:row-span-1';

            return (
              <div
                key={`post-${item.post.id}`}
                className={cn(
                  mobileClasses,
                  tabletColClasses,
                  tabletRowClasses,
                  desktopColClasses,
                  desktopRowClasses
                )}
              >
                <PostCard post={item.post} featured={item.featured} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
