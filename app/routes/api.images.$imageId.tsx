/**
 * API Route: Get Image URL
 * Returns signed URL for private images or public URL for public images
 */

import { data } from 'react-router';
import type { Route } from './+types/api.images.$imageId';
import { requireUserId } from '~/lib/session.server';
import { getImageById } from '~/db/services/images';
import { getSignedImageUrl, getPublicImageUrl } from '~/lib/r2.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  // Require authentication
  await requireUserId(request);

  const { imageId } = params;

  if (!imageId) {
    return data({ error: 'Image ID is required' }, { status: 400 });
  }

  try {
    // Get image metadata from database
    const image = await getImageById(imageId);

    if (!image) {
      return data({ error: 'Image not found' }, { status: 404 });
    }

    // Get URL search params to determine which size to return
    const url = new URL(request.url);
    const size = url.searchParams.get('size') || 'medium';

    // Determine which key to use
    let key: string;
    switch (size) {
      case 'original':
        key = image.originalKey;
        break;
      case 'thumbnail':
        key = image.thumbnailKey;
        break;
      case 'large':
        key = image.largeKey;
        break;
      case 'medium':
      default:
        key = image.mediumKey;
        break;
    }

    // Check if this is a private or public bucket
    const isPrivate = image.r2BucketName === process.env.R2_PRIVATE_BUCKET_NAME;

    let imageUrl: string;

    if (isPrivate) {
      // Generate signed URL for private images (expires in 1 hour)
      imageUrl = await getSignedImageUrl({
        bucket: image.r2BucketName,
        key,
        expiresIn: 3600,
      });
    } else {
      // Return public URL for public images
      imageUrl = getPublicImageUrl(image.r2BucketName, key);
    }

    return data({
      imageUrl,
      dimensions: {
        width: image.originalWidth,
        height: image.originalHeight,
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return data({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
