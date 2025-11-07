/**
 * API Route: Get or create invite code
 * GET/POST /api/invites/code
 */

import { data } from "react-router";
import type { Route } from "./+types/api.invites.code";
import { requireUserId } from "~/lib/session.server";
import { getOrCreateInviteCode, getReferredUsers, getReferralCount } from "~/db/services/invites";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  try {
    const inviteCodeData = await getOrCreateInviteCode(userId);
    const referredUsers = await getReferredUsers(userId);
    const referralCount = await getReferralCount(userId);

    if (!inviteCodeData) {
      return data(
        {
          error: "Unable to generate invite code at this time",
          success: false,
        },
        { status: 500 }
      );
    }

    return data({
      success: true,
      code: inviteCodeData.code,
      generatedAt: inviteCodeData.generatedAt,
      expiresAt: inviteCodeData.expiresAt,
      isUsed: inviteCodeData.isUsed,
      isExpired: inviteCodeData.isExpired,
      canGenerateNew: inviteCodeData.canGenerateNew,
      nextAvailableAt: inviteCodeData.nextAvailableAt,
      referredUsers,
      referralCount,
    });
  } catch (error) {
    console.error("Failed to get/create invite code:", error);
    return data(
      {
        error: `Failed to get invite code: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);

  try {
    const inviteCodeData = await getOrCreateInviteCode(userId);
    const referredUsers = await getReferredUsers(userId);
    const referralCount = await getReferralCount(userId);

    if (!inviteCodeData) {
      return data(
        {
          error: "Unable to generate invite code. Please wait until your next generation window.",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!inviteCodeData.canGenerateNew && (inviteCodeData.isUsed || inviteCodeData.isExpired)) {
      return data(
        {
          error: "Cannot generate new code yet. Please wait until your next generation window.",
          success: false,
          nextAvailableAt: inviteCodeData.nextAvailableAt,
        },
        { status: 400 }
      );
    }

    return data({
      success: true,
      message: "Invite code generated successfully",
      code: inviteCodeData.code,
      generatedAt: inviteCodeData.generatedAt,
      expiresAt: inviteCodeData.expiresAt,
      isUsed: inviteCodeData.isUsed,
      isExpired: inviteCodeData.isExpired,
      canGenerateNew: inviteCodeData.canGenerateNew,
      nextAvailableAt: inviteCodeData.nextAvailableAt,
      referredUsers,
      referralCount,
    });
  } catch (error) {
    console.error("Failed to generate invite code:", error);
    return data(
      {
        error: `Failed to generate invite code: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
