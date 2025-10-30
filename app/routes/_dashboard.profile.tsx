import { Form, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/_dashboard.profile";
import { getUserId, getSession } from "~/lib/session.server";
import { getProfileByUserId, updateProfile, getPostsByUserId } from "~/lib/db.client";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";

/**
 * Server Loader: Get user ID and email from session
 */
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const session = await getSession(request);
  const email = session.get("email");

  return { userId, email };
}

/**
 * Client Loader: Fetch profile from local database
 */
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  const { userId, email } = data as { userId: string | null; email: string | null };

  if (!userId) {
    return {
      profile: {
        display_name: "User",
        bio: "",
        location: "",
        website: "",
        created_at: new Date().toISOString(),
      },
      email: null,
      postCount: 0
    };
  }

  // Fetch profile from local database
  const profile = await getProfileByUserId(userId);
  const posts = await getPostsByUserId(userId);

  const profileData = profile as any || {
    display_name: email?.split("@")[0] || "User",
    bio: "",
    location: "",
    website: "",
    created_at: new Date().toISOString(),
  };

  return {
    profile: profileData,
    email,
    postCount: posts.length,
  };
}

clientLoader.hydrate = true;

/**
 * Client Action: Handle profile updates
 */
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId");

  if (intent === "update-profile") {
    const displayName = formData.get("displayName");
    const bio = formData.get("bio");
    const location = formData.get("location");
    const website = formData.get("website");

    // Validation
    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return { error: "Display name is required" };
    }

    if (typeof userId !== "string") {
      return { error: "User not authenticated" };
    }

    // Update profile in local database
    await updateProfile(userId, {
      displayName,
      bio: typeof bio === "string" ? bio : undefined,
      location: typeof location === "string" ? location : undefined,
      website: typeof website === "string" ? website : undefined,
    });

    return { success: true, message: "Profile updated successfully!" };
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
  const { userId } = useLoaderData<typeof loader>();
  const { profile, email, postCount } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-wallie-accent flex items-center justify-center text-white text-3xl font-bold">
            {profile.display_name?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name || "User"}</h1>
            <p className="text-gray-600">{email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Joined {dayjs(profile.created_at).format("MMMM YYYY")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{postCount}</p>
            <p className="text-sm text-gray-600">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Following</p>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Edit Profile</h2>

        <Form method="post" className="space-y-4" reloadDocument>
          <input type="hidden" name="intent" value="update-profile" />
          <input type="hidden" name="userId" value={userId || ""} />

          {/* Success message */}
          {actionData?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {actionData.message}
            </div>
          )}

          {/* Error message */}
          {actionData?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {actionData.error}
            </div>
          )}

          {/* Display name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              defaultValue={profile.display_name || ""}
              required
              className={cn(
                "w-full px-4 py-2 rounded-lg border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
              )}
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio || ""}
              className={cn(
                "w-full px-4 py-2 rounded-lg border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent",
                "resize-none"
              )}
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              defaultValue={profile.location || ""}
              className={cn(
                "w-full px-4 py-2 rounded-lg border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
              )}
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              defaultValue={profile.website || ""}
              className={cn(
                "w-full px-4 py-2 rounded-lg border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
              )}
              placeholder="https://"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={cn(
              "px-6 py-2 rounded-lg font-medium",
              "bg-wallie-primary text-white",
              "hover:bg-wallie-primary-hover",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:ring-offset-2",
              "transition-colors duration-200"
            )}
          >
            Save Changes
          </button>
        </Form>
      </div>
    </div>
  );
}
