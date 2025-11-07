/**
 * Image Processing Utility
 * Uses Sharp to process and convert images to AVIF format with multiple sizes
 */

import sharp from 'sharp';

const MAX_HEIGHT = 3000;
const THUMBNAIL_WIDTH = 150;
const MEDIUM_WIDTH = 800;
const LARGE_WIDTH = 1200;

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ProcessedImageSet {
  thumbnail: ProcessedImage;
  medium: ProcessedImage;
  large: ProcessedImage;
  original: {
    width: number;
    height: number;
  };
}

/**
 * Calculate dimensions maintaining aspect ratio with max height constraint
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  let width = targetWidth;
  let height = Math.round(width / aspectRatio);

  // Check if height exceeds max
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Process an image into multiple AVIF variants
 */
export async function processImage(
  imageBuffer: Buffer
): Promise<ProcessedImageSet> {
  // Get original dimensions
  const metadata = await sharp(imageBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image: could not read dimensions');
  }

  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  // Process thumbnail
  const thumbnailDims = calculateDimensions(
    originalWidth,
    originalHeight,
    THUMBNAIL_WIDTH
  );
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(thumbnailDims.width, thumbnailDims.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: 80 })
    .toBuffer();

  // Process medium
  const mediumDims = calculateDimensions(
    originalWidth,
    originalHeight,
    MEDIUM_WIDTH
  );
  const mediumBuffer = await sharp(imageBuffer)
    .resize(mediumDims.width, mediumDims.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: 85 })
    .toBuffer();

  // Process large
  const largeDims = calculateDimensions(
    originalWidth,
    originalHeight,
    LARGE_WIDTH
  );
  const largeBuffer = await sharp(imageBuffer)
    .resize(largeDims.width, largeDims.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: 90 })
    .toBuffer();

  return {
    thumbnail: {
      buffer: thumbnailBuffer,
      width: thumbnailDims.width,
      height: thumbnailDims.height,
      sizeBytes: thumbnailBuffer.length,
    },
    medium: {
      buffer: mediumBuffer,
      width: mediumDims.width,
      height: mediumDims.height,
      sizeBytes: mediumBuffer.length,
    },
    large: {
      buffer: largeBuffer,
      width: largeDims.width,
      height: largeDims.height,
      sizeBytes: largeBuffer.length,
    },
    original: {
      width: originalWidth,
      height: originalHeight,
    },
  };
}

/**
 * Validate image file type
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
  ];
  return validTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate image file size (max 18MB)
 */
export function isValidImageSize(sizeBytes: number): boolean {
  const MAX_SIZE = 18 * 1024 * 1024; // 18MB in bytes
  return sizeBytes <= MAX_SIZE;
}
