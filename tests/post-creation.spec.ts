import { test, expect } from '@playwright/test';

test.describe('Post Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login if needed
    await page.goto('/');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should create a new post successfully', async ({ page }) => {
    // Check if we need to login first
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      // Login flow
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Verify we're on the feed page
    await expect(page.locator('h2:has-text("Create a post")')).toBeVisible();
    await expect(page.locator('h2:has-text("Your Feed")')).toBeVisible();

    // Fill in the post content
    const postContent = 'This is a test post created at ' + new Date().toISOString();
    await page.fill('textarea[name="content"]', postContent);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Post")');

    // Wait for submission to complete
    await expect(page.locator('button[type="submit"]:has-text("Posting...")')).toBeHidden({ timeout: 5000 });

    // Verify success message appears
    await expect(page.locator('text=Post created successfully!')).toBeVisible();

    // Verify the textarea is cleared
    await expect(page.locator('textarea[name="content"]')).toHaveValue('');

    // Verify the post appears in the feed
    await expect(page.locator(`text=${postContent}`)).toBeVisible();
  });

  test('should show error when submitting empty post', async ({ page }) => {
    // Check if we need to login first
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Try to submit without content
    await page.click('button[type="submit"]:has-text("Post")');

    // Verify error message appears
    await expect(page.locator('text=Post content cannot be empty')).toBeVisible();
  });

  test('should show empty state when no posts exist', async ({ page }) => {
    // Check if we need to login first
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Check for empty state (might not be visible if posts exist)
    const emptyState = page.locator('text=Your feed is empty');
    const feedPosts = page.locator('article');

    // If no posts exist, empty state should be visible
    const postCount = await feedPosts.count();
    if (postCount === 0) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Start sharing your thoughts with the world!')).toBeVisible();
    }
  });

  test('should disable form while submitting', async ({ page }) => {
    // Check if we need to login first
    const loginForm = page.locator('input[name="email"]');
    if (await loginForm.isVisible()) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    }

    // Fill in post content
    await page.fill('textarea[name="content"]', 'Testing disabled state');

    // Submit the form
    const submitButton = page.locator('button[type="submit"]:has-text("Post")');
    await submitButton.click();

    // Check that button shows "Posting..." and is disabled
    await expect(page.locator('button[type="submit"]:has-text("Posting...")')).toBeDisabled();
    await expect(page.locator('textarea[name="content"]')).toBeDisabled();
  });
});
