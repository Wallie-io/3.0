import { Link } from "react-router";
import type { Route } from "./+types/_dashboard.communities.$communitySlug";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Individual Community Page
 * Shows posts from a specific community with community info sidebar
 */

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `c/${params.communitySlug} - Wallie` },
    { name: "description", content: `Community page for ${params.communitySlug}` }
  ];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { communitySlug } = params;

  // TODO: Replace with actual PGlite queries
  // For now, return mock data based on the slug

  const communityData = {
    "local-first-dev": {
      id: "1",
      name: "Local First Dev",
      slug: "local-first-dev",
      description: "A community for discussing local-first software development, offline-first architectures, and CRDTs.",
      longDescription: "This community is dedicated to developers building local-first applications. We discuss technologies like Electric-SQL, RxDB, automerge, and strategies for offline-first development.",
      icon: "💻",
      bannerColor: "#3b82f6",
      memberCount: 1247,
      activeMembers: 89,
      createdAt: new Date("2024-01-15"),
      rules: [
        "Be respectful and constructive",
        "Share code and examples when possible",
        "No spam or self-promotion without value",
        "Help newcomers learn",
      ],
      moderators: ["alex_dev", "sarah_codes"],
    },
    "decentralization": {
      id: "2",
      name: "Decentralization",
      slug: "decentralization",
      description: "All things decentralized web and peer-to-peer technology.",
      longDescription: "Explore the decentralized web, P2P protocols, distributed systems, and blockchain technology. From IPFS to WebRTC, we discuss it all.",
      icon: "🌐",
      bannerColor: "#8b5cf6",
      memberCount: 892,
      activeMembers: 43,
      createdAt: new Date("2023-11-20"),
      rules: [
        "Stay on topic - decentralization and P2P",
        "Technical discussions encouraged",
        "No cryptocurrency trading advice",
        "Cite sources for claims",
      ],
      moderators: ["p2p_pioneer"],
    },
    "privacy-tech": {
      id: "3",
      name: "Privacy Tech",
      slug: "privacy-tech",
      description: "Privacy-preserving technologies and encryption.",
      longDescription: "Discuss privacy technologies, encryption protocols, secure communication, and tools for protecting user data.",
      icon: "🔐",
      bannerColor: "#10b981",
      memberCount: 2103,
      activeMembers: 156,
      createdAt: new Date("2023-08-10"),
      rules: [
        "No illegal activities",
        "Respect different threat models",
        "Constructive criticism only",
        "Help others improve their privacy",
      ],
      moderators: ["crypto_enthusiast", "privacy_pro"],
    },
    "web3-design": {
      id: "4",
      name: "Web3 Design",
      slug: "web3-design",
      description: "UI/UX for decentralized applications.",
      longDescription: "A community for designers working on decentralized applications. Share your work, get feedback, and discuss design challenges unique to Web3.",
      icon: "🎨",
      bannerColor: "#f59e0b",
      memberCount: 567,
      activeMembers: 28,
      createdAt: new Date("2024-02-01"),
      rules: [
        "Share your design work",
        "Provide constructive feedback",
        "Credit original creators",
        "No AI-generated spam",
      ],
      moderators: ["design_dan"],
    },
    "indie-hackers": {
      id: "5",
      name: "Indie Hackers",
      slug: "indie-hackers",
      description: "Building products independently.",
      longDescription: "For solo founders and indie developers building profitable products. Share your journey, revenue, and lessons learned.",
      icon: "🚀",
      bannerColor: "#ec4899",
      memberCount: 3421,
      activeMembers: 234,
      createdAt: new Date("2023-06-05"),
      rules: [
        "Be transparent about your metrics",
        "No get-rich-quick schemes",
        "Share both wins and failures",
        "Support fellow indie hackers",
      ],
      moderators: ["startup_sarah", "solopreneur_sam"],
    },
  };

  const community = communityData[communitySlug as keyof typeof communityData] || {
    id: "unknown",
    name: "Unknown Community",
    slug: communitySlug,
    description: "This community doesn't exist yet.",
    longDescription: "",
    icon: "❓",
    bannerColor: "#6b7280",
    memberCount: 0,
    activeMembers: 0,
    createdAt: new Date(),
    rules: [],
    moderators: [],
  };

  // Mock posts for this community
  const posts = [
    {
      id: "1",
      authorName: "alex_dev",
      authorId: "user1",
      title: `Welcome to c/${communitySlug}!`,
      content: `This is a placeholder post for the ${community.name} community. Once the database is integrated, you'll see real posts here.`,
      upvotes: 42,
      commentCount: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isPinned: true,
    },
    {
      id: "2",
      authorName: "community_member",
      authorId: "user2",
      title: "Excited to be here!",
      content: "Just joined this community and looking forward to learning from everyone here.",
      upvotes: 23,
      commentCount: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      isPinned: false,
    },
  ];

  return { community, posts };
}

clientLoader.hydrate = true;

export default function CommunityPage({ loaderData, params }: Route.ComponentProps) {
  const { community, posts } = loaderData;
  const isJoined = false; // TODO: Check if user is a member

  return (
    <div className="max-w-7xl mx-auto -mt-6">
      {/* Community Banner */}
      <div
        className="h-32 rounded-t-lg"
        style={{ backgroundColor: community.bannerColor }}
      />

      {/* Community Header */}
      <div className="bg-white border-x border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl -mt-8 bg-white rounded-full p-2 border-4 border-white">
              {community.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                c/{community.slug}
              </h1>
              <p className="text-gray-600 mt-1">{community.description}</p>
            </div>
          </div>
          <button
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-colors",
              isJoined
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-wallie-accent text-white hover:bg-wallie-accent-dim"
            )}
          >
            {isJoined ? "Joined ✓" : "Join"}
          </button>
        </div>

        {/* Community Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="font-bold text-gray-900">
              {community.memberCount.toLocaleString()}
            </span>
            <span className="text-gray-500 ml-1">members</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="font-bold text-gray-900">{community.activeMembers}</span>
            <span className="text-gray-500">online</span>
          </div>
          <div className="text-gray-500">
            Created {dayjs(community.createdAt).format("MMM YYYY")}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Posts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Post Button */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Link
              to={`/communities/${community.slug}/submit`}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2 rounded-lg",
                "bg-gray-50 text-gray-500 hover:bg-gray-100",
                "transition-colors border border-gray-200"
              )}
            >
              <span>💬</span>
              <span>Create a post</span>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-2 flex gap-2">
            <FilterTab active>Hot 🔥</FilterTab>
            <FilterTab>New ✨</FilterTab>
            <FilterTab>Top 📈</FilterTab>
          </div>

          {/* Posts */}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} communitySlug={community.slug} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* About Community */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About Community</h2>
            <p className="text-sm text-gray-700 mb-4">{community.longDescription}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-900">
                  {dayjs(community.createdAt).format("MMM D, YYYY")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Members</span>
                <span className="font-medium text-gray-900">
                  {community.memberCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          {community.rules.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Rules</h2>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {community.rules.map((rule, index) => (
                  <li key={index} className="text-gray-700">
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Moderators */}
          {community.moderators.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Moderators</h2>
              <div className="space-y-2">
                {community.moderators.map((mod) => (
                  <Link
                    key={mod}
                    to={`/profile/${mod}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-wallie-accent"
                  >
                    <span>👤</span>
                    <span>u/{mod}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Post Card Component
 */
function PostCard({ post, communitySlug }: { post: any; communitySlug: string }) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="p-4">
        {/* Post header */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <Link to={`/profile/${post.authorId}`} className="hover:underline font-medium">
            u/{post.authorName}
          </Link>
          <span>•</span>
          <span>{dayjs(post.createdAt).fromNow()}</span>
          {post.isPinned && (
            <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
              📌 Pinned by moderators
            </span>
          )}
        </div>

        {/* Post content */}
        <Link to={`/communities/${communitySlug}/posts/${post.id}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-wallie-accent transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-700 mb-4">{post.content}</p>
        </Link>

        {/* Post actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "text-gray-600 hover:bg-gray-100 transition-colors"
            )}
          >
            <span>⬆️</span>
            <span className="font-medium">{post.upvotes}</span>
            <span>⬇️</span>
          </button>
          <Link
            to={`/communities/${communitySlug}/posts/${post.id}#comments`}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "text-gray-600 hover:bg-gray-100 transition-colors"
            )}
          >
            <span>💬</span>
            <span>{post.commentCount} comments</span>
          </Link>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "text-gray-600 hover:bg-gray-100 transition-colors"
            )}
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Filter Tab Component
 */
function FilterTab({ active = false, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button
      className={cn(
        "flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}
