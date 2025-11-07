/**
 * Image Database Service
 * Handles database operations for images
 */

import { db } from '../connection';
import { images, type NewImage, type Image } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Create a new image record
 */
export async function createImage(imageData: NewImage): Promise<Image> {
  const [image] = await db.insert(images).values(imageData).returning();
  return image;
}

/**
 * Get image by ID
 */
export async function getImageById(id: string): Promise<Image | undefined> {
  const [image] = await db.select().from(images).where(eq(images.id, id));
  return image;
}

/**
 * Get images by message ID
 */
export async function getImagesByMessageId(
  messageId: string
): Promise<Image[]> {
  return db.select().from(images).where(eq(images.messageId, messageId));
}

/**
 * Get images by post ID
 */
export async function getImagesByPostId(postId: string): Promise<Image[]> {
  return db.select().from(images).where(eq(images.postId, postId));
}

/**
 * Get total storage used by a user (in MB)
 */
export async function getUserStorageUsage(userId: string): Promise<number> {
  const userImages = await db
    .select()
    .from(images)
    .where(eq(images.userId, userId));

  return userImages.reduce(
    (total, img) => total + parseFloat(img.totalStorageMb),
    0
  );
}
