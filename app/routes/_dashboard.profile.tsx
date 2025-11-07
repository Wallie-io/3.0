import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard.profile";
import { getUserId, getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { UnderDevelopment } from "~/components/UnderDevelopment";

dayjs.extend(relativeTime);

/**
 * Server Loader: Get user profile data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const session = await getSession(request);
  const email = session.get("email");

  // Mock profile data for under development page
  const profile = {
    display_name: email?.split("@")[0] || "User",
    bio: "",
    location: "",
    website: "",
    created_at: new Date().toISOString(),
  };

  return {
    userId,
    email,
    profile,
    postCount: 0,
  };
}

/**
 * Server Action: Handle profile updates (disabled for now)
 */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-profile") {
    return { error: "Profile editing is not available yet" } as const;
  }

  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile - Wallie" },
    { name: "description", content: "Your Wallie profile" },
  ];
}

export default function Profile() {
  const { userId, profile, email, postCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-7xl mx-auto">
      <UnderDevelopment pageName="Profile" />
      {/* Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6 auto-rows-auto">

        {/* Profile Card - 1x2 span on desktop */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-2">
          <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10 p-6 h-full">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark text-5xl font-bold shadow-wallie-glow-accent">
                {profile.display_name?.[0]?.toUpperCase() || "U"}
              </div>
            </div>

            {/* Profile info */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-[24px] font-bold text-wallie-text-primary">
                {profile.display_name || "User"}
              </h1>
              <p className="text-sm text-wallie-text-secondary">{email}</p>
              <p className="text-xs text-wallie-text-tertiary">
                Joined {dayjs(profile.created_at).format("MMMM YYYY")}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6 p-4 rounded-lg bg-wallie-slate/50">
                <p className="text-sm text-wallie-text-secondary leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Additional info */}
            <div className="space-y-2">
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-wallie-text-secondary">
                  <span>📍</span>
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2 text-sm">
                  <span>🔗</span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wallie-accent hover:text-wallie-accent-dim transition-colors truncate"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - 3 individual cards spanning 2 columns each */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-[32px] font-bold text-wallie-accent">{postCount}</p>
            <p className="text-sm text-wallie-text-tertiary font-medium">Posts</p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-[32px] font-bold text-wallie-purple">0</p>
            <p className="text-sm text-wallie-text-tertiary font-medium">Followers</p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 lg:col-span-2">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 text-center h-full">
            <p className="text-[32px] font-bold text-wallie-success">0</p>
            <p className="text-sm text-wallie-text-tertiary font-medium">Following</p>
          </div>
        </div>

        {/* Activity Widget */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 h-full">
            <h3 className="text-[18px] font-semibold text-wallie-text-primary mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-wallie-slate/50">
                <div className="w-8 h-8 rounded-full bg-wallie-accent/20 flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wallie-text-secondary">Created {postCount} posts</p>
                  <p className="text-xs text-wallie-text-tertiary">Today</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-wallie-slate/50">
                <div className="w-8 h-8 rounded-full bg-wallie-purple/20 flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wallie-text-secondary">Profile completed</p>
                  <p className="text-xs text-wallie-text-tertiary">{dayjs(profile.created_at).fromNow()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Widget */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-wallie-darker/70 backdrop-blur-xl rounded-2xl shadow-wallie-md border border-white/10 p-6 h-full">
            <h3 className="text-[18px] font-semibold text-wallie-text-primary mb-4">
              Achievements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-wallie-slate/50 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <p className="text-xs text-wallie-text-tertiary">Early Adopter</p>
              </div>
              <div className="p-3 rounded-lg bg-wallie-slate/50 text-center opacity-50">
                <div className="text-2xl mb-1">🔥</div>
                <p className="text-xs text-wallie-text-tertiary">Locked</p>
              </div>
              <div className="p-3 rounded-lg bg-wallie-slate/50 text-center opacity-50">
                <div className="text-2xl mb-1">⭐</div>
                <p className="text-xs text-wallie-text-tertiary">Locked</p>
              </div>
              <div className="p-3 rounded-lg bg-wallie-slate/50 text-center opacity-50">
                <div className="text-2xl mb-1">💎</div>
                <p className="text-xs text-wallie-text-tertiary">Locked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form - Full width */}
        <div className="col-span-12">
          <div className="bg-wallie-darker rounded-2xl shadow-wallie-lg border border-white/10 p-6">
            <h2 className="text-[20px] font-semibold text-wallie-text-primary mb-6">Edit Profile</h2>

            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-profile" />
              <input type="hidden" name="userId" value={userId || ""} />

              {/* Error message */}
              {actionData?.error && (
                <div className="p-3 rounded-lg bg-wallie-error/10 border border-wallie-error/20 text-wallie-error text-sm">
                  {actionData.error}
                </div>
              )}

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display name */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-wallie-text-secondary mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.display_name || ""}
                    required
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-wallie-slate text-wallie-text-primary",
                      "border border-wallie-charcoal",
                      "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                      "transition-all duration-200"
                    )}
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-wallie-text-secondary mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    defaultValue={profile.location || ""}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-wallie-slate text-wallie-text-primary",
                      "border border-wallie-charcoal",
                      "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                      "placeholder:text-wallie-text-muted",
                      "transition-all duration-200"
                    )}
                    placeholder="City, Country"
                  />
                </div>

                {/* Bio - Full width */}
                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-wallie-text-secondary mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    defaultValue={profile.bio || ""}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-wallie-slate text-wallie-text-primary",
                      "border border-wallie-charcoal",
                      "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                      "placeholder:text-wallie-text-muted resize-none",
                      "transition-all duration-200"
                    )}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-wallie-text-secondary mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    defaultValue={profile.website || ""}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-wallie-slate text-wallie-text-primary",
                      "border border-wallie-charcoal",
                      "focus:outline-none focus:ring-2 focus:ring-wallie-accent/20 focus:border-wallie-accent",
                      "placeholder:text-wallie-text-muted",
                      "transition-all duration-200"
                    )}
                    placeholder="https://"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={cn(
                    "px-6 py-3 rounded-lg font-semibold",
                    "bg-wallie-accent text-wallie-dark",
                    "shadow-wallie-glow-accent",
                    "hover:bg-wallie-accent/90 hover:shadow-wallie-xl",
                    "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2 focus:ring-offset-wallie-darker",
                    "transition-all duration-200",
                    "active:scale-[0.98]"
                  )}
                >
                  Save Changes
                </button>
              </div>
            </Form>
          </div>
        </div>

      </div>
    </div>
  );
}
