/**
 * Debug Route: Check R2 Configuration
 */

import { data } from 'react-router';
import type { Route } from './+types/api.images.debug';
import { requireUserId } from '~/lib/session.server';

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserId(request);

  return data({
    hasAccountId: !!process.env.R2_ACCOUNT_ID,
    hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    hasEndpoint: !!process.env.R2_ENDPOINT,
    accessKeyIdLength: process.env.R2_ACCESS_KEY_ID?.length || 0,
    secretKeyLength: process.env.R2_SECRET_ACCESS_KEY?.length || 0,
    accountIdLength: process.env.R2_ACCOUNT_ID?.length || 0,
    // Don't expose actual values, just first/last chars for verification
    accessKeyIdPreview: process.env.R2_ACCESS_KEY_ID
      ? `${process.env.R2_ACCESS_KEY_ID.slice(0, 4)}...${process.env.R2_ACCESS_KEY_ID.slice(-4)}`
      : 'missing',
  });
}
