/**
 * API Route: Image Upload
 * Handles image uploads for messages and posts
 */

import { data } from 'react-router';
import type { Route } from './+types/api.images.upload';
import { requireUserId } from '~/lib/session.server';
import {
  processImage,
  isValidImageType,
  isValidImageSize,
} from '~/lib/image-processor.server';
import { uploadToR2 } from '~/lib/r2.server';
import { createImage } from '~/db/services/images';
import { nanoid } from 'nanoid';

export async function action({ request }: Route.ActionArgs) {
  // Require authentication
  const userId = await requireUserId(request);

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const context = formData.get('context') as string | null; // 'message' or 'post'
    const postId = formData.get('postId') as string | null;

    if (!file) {
      return data({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return data(
        {
          error:
            'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, AVIF',
        },
        { status: 400 }
      );
    }

    // Validate file size (18MB max)
    if (!isValidImageSize(file.size)) {
      return data(
        { error: 'File size exceeds 18MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image into variants
    const processed = await processImage(buffer);

    // Generate unique keys for R2
    const imageId = nanoid();
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const originalKey = `${userId}/${imageId}-original-${timestamp}.${fileExtension}`;
    const thumbnailKey = `${userId}/${imageId}-thumb-${timestamp}.avif`;
    const mediumKey = `${userId}/${imageId}-medium-${timestamp}.avif`;
    const largeKey = `${userId}/${imageId}-large-${timestamp}.avif`;

    // Determine bucket based on context (private for DMs, public for posts)
    const bucketName = context === 'message'
      ? process.env.R2_PRIVATE_BUCKET_NAME!
      : process.env.R2_PUBLIC_BUCKET_NAME!;

    // Upload all variants to R2 (including original)
    await Promise.all([
      uploadToR2({
        bucket: bucketName,
        key: originalKey,
        body: buffer,
        contentType: file.type,
      }),
      uploadToR2({
        bucket: bucketName,
        key: thumbnailKey,
        body: processed.thumbnail.buffer,
        contentType: 'image/avif',
      }),
      uploadToR2({
        bucket: bucketName,
        key: mediumKey,
        body: processed.medium.buffer,
        contentType: 'image/avif',
      }),
      uploadToR2({
        bucket: bucketName,
        key: largeKey,
        body: processed.large.buffer,
        contentType: 'image/avif',
      }),
    ]);

    // Calculate total storage in MB (including original)
    const totalBytes =
      buffer.length + // Original file
      processed.thumbnail.sizeBytes +
      processed.medium.sizeBytes +
      processed.large.sizeBytes;
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    // Save to database
    // Note: messageId is left null at upload time and can be associated later when message is sent
    const image = await createImage({
      id: imageId,
      userId,
      originalFilename: file.name,
      totalStorageMb: totalMB,
      messageId: null, // Will be associated when message is sent
      postId: postId || null,
      r2BucketName: bucketName,
      originalKey,
      originalSizeBytes: buffer.length,
      thumbnailKey,
      thumbnailSizeBytes: processed.thumbnail.sizeBytes,
      mediumKey,
      mediumSizeBytes: processed.medium.sizeBytes,
      largeKey,
      largeSizeBytes: processed.large.sizeBytes,
      originalWidth: processed.original.width,
      originalHeight: processed.original.height,
    });

    return data(
      {
        success: true,
        imageId: image.id,
        dimensions: {
          width: processed.original.width,
          height: processed.original.height,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Image upload error:', error);
    return data(
      { error: 'Failed to process image upload' },
      { status: 500 }
    );
  }
}
