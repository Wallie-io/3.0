import { Link } from "react-router";
import type { Route } from "./+types/_dashboard.hangouts._index";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Hangouts Landing Page
 * Voice/video chat rooms - similar to Discord or Clubhouse
 */

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hangouts - Wallie" },
    { name: "description", content: "Join voice and video hangouts on Wallie" }
  ];
}

export async function clientLoader() {
  // TODO: Replace with actual PGlite queries
  // For now, return mock data

  const activeHangouts = [
    {
      id: "1",
      name: "Local-First Builders Standup",
      description: "Daily standup for developers building local-first apps",
      hostName: "alex_dev",
      participantCount: 12,
      maxParticipants: 50,
      isLive: true,
      category: "Development",
      startedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      icon: "💻",
    },
    {
      id: "2",
      name: "Indie Hacker Coffee Chat",
      description: "Casual morning coffee chat for indie hackers",
      hostName: "startup_sarah",
      participantCount: 8,
      maxParticipants: 20,
      isLive: true,
      category: "Business",
      startedAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      icon: "☕",
    },
    {
      id: "3",
      name: "Web3 Design Critique",
      description: "Get feedback on your dApp designs",
      hostName: "design_dan",
      participantCount: 15,
      maxParticipants: 30,
      isLive: true,
      category: "Design",
      startedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      icon: "🎨",
    },
    {
      id: "4",
      name: "Privacy Tech Deep Dive",
      description: "Technical discussion about E2EE and privacy tech",
      hostName: "crypto_enthusiast",
      participantCount: 23,
      maxParticipants: 100,
      isLive: true,
      category: "Technology",
      startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      icon: "🔐",
    },
  ];

  const scheduledHangouts = [
    {
      id: "5",
      name: "Weekend Project Showcase",
      description: "Show off what you built this weekend!",
      hostName: "p2p_pioneer",
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
      expectedParticipants: 30,
      category: "Development",
      icon: "🚀",
    },
    {
      id: "6",
      name: "Decentralization 101",
      description: "Learn the basics of P2P and decentralized systems",
      hostName: "web3_wizard",
      scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      expectedParticipants: 50,
      category: "Education",
      icon: "🌐",
    },
  ];

  return { activeHangouts, scheduledHangouts };
}

clientLoader.hydrate = true;

export default function HangoutsIndex({ loaderData }: Route.ComponentProps) {
  const { activeHangouts, scheduledHangouts } = loaderData;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-wallie-text-primary">Hangouts 🎙️</h1>
                <p className="text-sm text-wallie-text-secondary mt-1">
                  Join voice and video conversations with the community
                </p>
              </div>
              <Link
                to="/hangouts/create"
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold",
                  "bg-wallie-accent text-wallie-dark",
                  "shadow-wallie-glow-accent",
                  "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                  "transition-all duration-200"
                )}
              >
                + Start Hangout
              </Link>
            </div>
          </div>

          {/* Live Hangouts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-wallie-text-primary flex items-center gap-2">
              <span className="w-3 h-3 bg-wallie-error rounded-full animate-pulse"></span>
              Live Now ({activeHangouts.length})
            </h2>
            {activeHangouts.map((hangout) => (
              <HangoutCard key={hangout.id} hangout={hangout} isLive />
            ))}
          </div>

          {/* Scheduled Hangouts */}
          {scheduledHangouts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-wallie-text-primary flex items-center gap-2">
                📅 Scheduled
              </h2>
              {scheduledHangouts.map((hangout) => (
                <ScheduledHangoutCard key={hangout.id} hangout={hangout} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Categories */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-wallie-text-primary mb-4">Categories</h3>
            <div className="space-y-2">
              {["All", "Development", "Design", "Business", "Technology", "Education", "Casual"].map((category) => (
                <button
                  key={category}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-lg text-sm font-medium",
                    "transition-colors",
                    category === "All"
                      ? "bg-wallie-accent text-wallie-dark"
                      : "text-wallie-text-secondary hover:bg-wallie-charcoal/50 hover:text-wallie-text-primary"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-wallie-text-primary mb-4">Hangout Guidelines</h3>
            <ul className="space-y-2 text-sm text-wallie-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-wallie-success">✓</span>
                <span>Be respectful and welcoming</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wallie-success">✓</span>
                <span>Stay on topic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wallie-success">✓</span>
                <span>Mute when not speaking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wallie-error">✗</span>
                <span>No spam or self-promotion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wallie-error">✗</span>
                <span>No harassment or hate speech</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Live Hangout Card Component
 */
function HangoutCard({ hangout, isLive }: { hangout: any; isLive: boolean }) {
  const participantPercentage = (hangout.participantCount / hangout.maxParticipants) * 100;

  return (
    <article
      className={cn(
        "bg-wallie-darker rounded-2xl shadow-wallie-md p-6",
        "border border-transparent hover:border-wallie-accent/20",
        "hover:shadow-wallie-lg transition-all duration-300"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{hangout.icon}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <Link
                to={`/hangouts/${hangout.id}`}
                className="text-xl font-bold text-wallie-text-primary hover:text-wallie-accent transition-colors"
              >
                {hangout.name}
              </Link>
              <p className="text-sm text-wallie-text-secondary mt-1">{hangout.description}</p>
            </div>
            {isLive && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-wallie-error/20 text-wallie-error text-xs font-semibold rounded-full">
                <span className="w-2 h-2 bg-wallie-error rounded-full animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-wallie-text-tertiary mb-4">
            <span>Hosted by {hangout.hostName}</span>
            <span>•</span>
            <span>Started {dayjs(hangout.startedAt).fromNow()}</span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-wallie-purple/20 text-wallie-purple rounded text-xs font-medium">
              {hangout.category}
            </span>
          </div>

          {/* Participant bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-wallie-text-secondary">
                {hangout.participantCount} / {hangout.maxParticipants} participants
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  participantPercentage > 80 ? "text-wallie-error" : "text-wallie-success"
                )}
              >
                {participantPercentage > 80 ? "Almost full!" : "Join now"}
              </span>
            </div>
            <div className="w-full h-2 bg-wallie-charcoal rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  participantPercentage > 80 ? "bg-wallie-error" : "bg-wallie-success"
                )}
                style={{ width: `${participantPercentage}%` }}
              />
            </div>
          </div>

          <Link
            to={`/hangouts/${hangout.id}`}
            className={cn(
              "mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium",
              "bg-wallie-accent text-wallie-dark",
              "hover:bg-wallie-accent/90 transition-colors"
            )}
          >
            🎙️ Join Hangout
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Scheduled Hangout Card Component
 */
function ScheduledHangoutCard({ hangout }: { hangout: any }) {
  return (
    <article
      className={cn(
        "bg-wallie-darker rounded-2xl shadow-wallie-md p-6",
        "border border-transparent hover:border-wallie-purple/20",
        "hover:shadow-wallie-lg transition-all duration-300"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{hangout.icon}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-xl font-bold text-wallie-text-primary">{hangout.name}</h3>
              <p className="text-sm text-wallie-text-secondary mt-1">{hangout.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-wallie-text-tertiary mb-4">
            <span>Hosted by {hangout.hostName}</span>
            <span>•</span>
            <span>{dayjs(hangout.scheduledFor).format("MMM D, h:mm A")}</span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-wallie-purple/20 text-wallie-purple rounded text-xs font-medium">
              {hangout.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={cn(
                "px-6 py-2 rounded-lg font-medium",
                "bg-wallie-charcoal/50 text-wallie-text-primary",
                "hover:bg-wallie-charcoal transition-colors"
              )}
            >
              🔔 Set Reminder
            </button>
            <span className="text-sm text-wallie-text-tertiary">
              ~{hangout.expectedParticipants} expected
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
