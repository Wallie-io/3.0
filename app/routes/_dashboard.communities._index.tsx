import { Link } from "react-router";
import type { Route } from "./+types/_dashboard.communities._index";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Communities Landing Page
 * Similar to Reddit front page - shows top communities and promoted/top posts
 */

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Communities - Wallie" },
    { name: "description", content: "Discover and join communities on Wallie" }
  ];
}

export async function clientLoader() {
  // TODO: Replace with actual PGlite queries
  // For now, return mock data

  const topCommunities = [
    {
      id: "1",
      name: "Local First Dev",
      slug: "local-first-dev",
      description: "Discussion about local-first software development",
      memberCount: 1247,
      activeMembers: 89,
      icon: "💻",
    },
    {
      id: "2",
      name: "Decentralization",
      slug: "decentralization",
      description: "All things decentralized web and P2P",
      memberCount: 892,
      activeMembers: 43,
      icon: "🌐",
    },
    {
      id: "3",
      name: "Privacy Tech",
      slug: "privacy-tech",
      description: "Privacy-preserving technologies and encryption",
      memberCount: 2103,
      activeMembers: 156,
      icon: "🔐",
    },
    {
      id: "4",
      name: "Web3 Design",
      slug: "web3-design",
      description: "UI/UX for decentralized applications",
      memberCount: 567,
      activeMembers: 28,
      icon: "🎨",
    },
    {
      id: "5",
      name: "Indie Hackers",
      slug: "indie-hackers",
      description: "Building products independently",
      memberCount: 3421,
      activeMembers: 234,
      icon: "🚀",
    },
  ];

  const topPosts = [
    {
      id: "1",
      communityId: "1",
      communityName: "Local First Dev",
      communitySlug: "local-first-dev",
      communityIcon: "💻",
      authorName: "alex_dev",
      title: "Just launched my first local-first app with Electric-SQL",
      content: "After months of work, I finally shipped my app using Electric-SQL and React. The offline-first experience is amazing!",
      upvotes: 234,
      commentCount: 45,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      isPinned: false,
    },
    {
      id: "2",
      communityId: "3",
      communityName: "Privacy Tech",
      communitySlug: "privacy-tech",
      communityIcon: "🔐",
      authorName: "crypto_enthusiast",
      title: "Comparing E2EE implementations: Signal Protocol vs TweetNaCl",
      content: "Deep dive into different approaches to end-to-end encryption for messaging apps...",
      upvotes: 189,
      commentCount: 67,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      isPinned: true,
    },
    {
      id: "3",
      communityId: "5",
      communityName: "Indie Hackers",
      communitySlug: "indie-hackers",
      communityIcon: "🚀",
      authorName: "startup_sarah",
      title: "Hit $5k MRR with my side project!",
      content: "Started this project 6 months ago and just crossed $5k monthly recurring revenue. Here's what worked...",
      upvotes: 512,
      commentCount: 89,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      isPinned: false,
    },
    {
      id: "4",
      communityId: "2",
      communityName: "Decentralization",
      communitySlug: "decentralization",
      communityIcon: "🌐",
      authorName: "p2p_pioneer",
      title: "WebRTC without servers - true peer-to-peer discovery",
      content: "Exploring STUN-less WebRTC connections using local network discovery and QR codes for initial handshake...",
      upvotes: 156,
      commentCount: 34,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
      isPinned: false,
    },
    {
      id: "5",
      communityId: "4",
      communityName: "Web3 Design",
      communitySlug: "web3-design",
      communityIcon: "🎨",
      authorName: "design_dan",
      title: "Design system for decentralized apps - free Figma file",
      content: "Created a comprehensive design system specifically for dApps. Includes components for wallet connections, transaction states, and more.",
      upvotes: 298,
      commentCount: 23,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isPinned: false,
    },
  ];

  return { topCommunities, topPosts };
}

clientLoader.hydrate = true;

export default function CommunitiesIndex({ loaderData }: Route.ComponentProps) {
  const { topCommunities, topPosts } = loaderData;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header with filters */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-wallie-text-primary">Popular Posts</h1>
              <div className="flex gap-2">
                <FilterButton active>Hot 🔥</FilterButton>
                <FilterButton>New ✨</FilterButton>
                <FilterButton>Top 📈</FilterButton>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          {topPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Sidebar with top communities */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create Community Button */}
          <Link
            to="/communities/create"
            className={cn(
              "block w-full py-3 px-6 rounded-lg text-center font-semibold",
              "bg-wallie-accent text-wallie-dark",
              "shadow-wallie-glow-accent",
              "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
              "transition-all duration-200"
            )}
          >
            + Create Community
          </Link>

          {/* Top Communities */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h2 className="text-lg font-bold text-wallie-text-primary mb-4">Top Communities</h2>
            <div className="space-y-3">
              {topCommunities.map((community, index) => (
                <CommunityCard key={community.id} community={community} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* User's Communities (placeholder) */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h2 className="text-lg font-bold text-wallie-text-primary mb-4">Your Communities</h2>
            <p className="text-sm text-wallie-text-secondary text-center py-4">
              Join some communities to see them here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Post Card Component
 */
function PostCard({ post }: { post: any }) {
  return (
    <article className={cn(
      "bg-wallie-darker rounded-2xl shadow-wallie-md p-6",
      "border border-transparent hover:border-wallie-accent/20",
      "hover:shadow-wallie-lg transition-all duration-300"
    )}>
      {/* Community header */}
      <div className="flex items-center gap-2 mb-3">
        <Link
          to={`/communities/${post.communitySlug}`}
          className="flex items-center gap-2 hover:underline"
        >
          <span className="text-2xl">{post.communityIcon}</span>
          <span className="font-medium text-wallie-text-primary">c/{post.communitySlug}</span>
        </Link>
        <span className="text-wallie-text-tertiary">•</span>
        <span className="text-sm text-wallie-text-tertiary">
          Posted by {post.authorName} {dayjs(post.createdAt).fromNow()}
        </span>
        {post.isPinned && (
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-wallie-accent/10 text-wallie-accent rounded">
            📌 Pinned
          </span>
        )}
      </div>

      {/* Post content */}
      <Link to={`/communities/${post.communitySlug}/posts/${post.id}`}>
        <h2 className="text-xl font-bold text-wallie-text-primary mb-2 hover:text-wallie-accent transition-colors">
          {post.title}
        </h2>
        <p className="text-wallie-text-secondary mb-4 line-clamp-2">{post.content}</p>
      </Link>

      {/* Post actions */}
      <div className="flex items-center gap-4 text-sm">
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "text-wallie-text-secondary hover:bg-wallie-charcoal/50 hover:text-wallie-text-primary transition-colors"
          )}
        >
          <span>⬆️</span>
          <span className="font-medium">{post.upvotes}</span>
          <span>⬇️</span>
        </button>
        <Link
          to={`/communities/${post.communitySlug}/posts/${post.id}#comments`}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "text-wallie-text-secondary hover:bg-wallie-charcoal/50 hover:text-wallie-text-primary transition-colors"
          )}
        >
          <span>💬</span>
          <span>{post.commentCount} comments</span>
        </Link>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "text-wallie-text-secondary hover:bg-wallie-charcoal/50 hover:text-wallie-text-primary transition-colors"
          )}
        >
          <span>🔗</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}

/**
 * Community Card Component
 */
function CommunityCard({ community, rank }: { community: any; rank: number }) {
  return (
    <Link
      to={`/communities/${community.slug}`}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-wallie-charcoal/50 transition-colors"
    >
      <div className="flex-shrink-0 w-8 text-wallie-text-tertiary font-medium text-sm">{rank}</div>
      <div className="flex-shrink-0 text-3xl">{community.icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-wallie-text-primary truncate">c/{community.slug}</h3>
        <p className="text-sm text-wallie-text-secondary line-clamp-1">{community.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-wallie-text-tertiary">
          <span>{community.memberCount.toLocaleString()} members</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-wallie-success rounded-full"></span>
            {community.activeMembers} online
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Filter Button Component
 */
function FilterButton({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
        active
          ? "bg-wallie-accent text-wallie-dark shadow-wallie-glow-accent"
          : "bg-wallie-charcoal/50 text-wallie-text-secondary hover:bg-wallie-charcoal hover:text-wallie-text-primary"
      )}
    >
      {children}
    </button>
  );
}
