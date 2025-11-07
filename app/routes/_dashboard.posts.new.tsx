/**
 * Create New Post Route
 * Modal/page for creating new posts with rich text editor
 */

import { useState, useCallback, useRef } from 'react';
import { data, redirect } from 'react-router';
import { Form, useNavigate, useActionData, useNavigation, useLocation } from 'react-router';
import type { Route } from './+types/_dashboard.posts.new';
import { RichTextEditor } from '~/components/RichTextEditor';
import { getInitialValue, serializeToMarkdown, type CustomElement } from '~/lib/slate-markdown';
import { createPost, getPostById } from '~/db/services/posts';
import { requireUserId, getUserId } from '~/lib/session.server';
import { cn } from '~/lib/utils';
import type { Descendant } from 'slate';

// ============================================================================
// Server Loader
// ============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const url = new URL(request.url);
  const replyToId = url.searchParams.get('replyTo');

  // If replying to a post, fetch the parent post
  if (replyToId) {
    const parentPost = await getPostById(replyToId);
    return data({ userId, parentPost });
  }

  return data({ userId, parentPost: null });
}

// ============================================================================
// Server Action
// ============================================================================

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const content = formData.get('content');
  const replyToId = formData.get('replyToId');

  // Validate content
  if (typeof content !== 'string' || content.trim().length === 0) {
    return data(
      { error: 'Post content cannot be empty', success: false },
      { status: 400 }
    );
  }

  try {
    // Create post
    const post = await createPost({
      authorId: userId,
      content: content.trim(),
      replyToId: replyToId && typeof replyToId === 'string' ? replyToId : undefined,
    });

    // Redirect to home or to the post detail page
    if (replyToId && typeof replyToId === 'string') {
      return redirect(`/posts/${replyToId}`);
    }

    return redirect('/');
  } catch (error) {
    console.error('Failed to create post:', error);
    return data(
      {
        error: `Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Component
// ============================================================================

export default function NewPost({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const formRef = useRef<HTMLFormElement>(null);

  // Get replyToId from URL search params
  const searchParams = new URLSearchParams(location.search);
  const replyToId = searchParams.get('replyTo');

  // Get parent post from loader
  const { parentPost } = loaderData;

  // Slate editor state
  const [editorValue, setEditorValue] = useState<Descendant[]>(getInitialValue());
  const [content, setContent] = useState('');

  // Update markdown content whenever editor changes
  const handleEditorChange = useCallback((value: Descendant[]) => {
    console.log('Editor changed, value:', value);
    setEditorValue(value);
    const markdown = serializeToMarkdown(value);
    console.log('Serialized markdown:', markdown);
    setContent(markdown);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      console.log('Form submit called');
      console.log('Content:', content);
      console.log('Content length:', content.length);

      // Validate content
      if (!content || content.trim() === '') {
        e.preventDefault();
        console.log('Validation failed - content is empty');
        alert('Please write something before posting');
        return;
      }

      console.log('Validation passed - form will submit');
      // Let form submit naturally
    },
    [content]
  );

  // Close modal
  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle keyboard shortcut submit
  const handleKeyboardSubmit = useCallback(() => {
    if (!content || content.trim() === '') {
      alert('Please write something before posting');
      return;
    }
    formRef.current?.requestSubmit();
  }, [content]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                {parentPost ? 'Reply' : 'Create Post'}
              </h2>
              {parentPost && (
                <p className="mt-1 text-sm text-gray-400">
                  Replying to <span className="text-wallie-accent">{parentPost.author_name}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
              disabled={isSubmitting}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {actionData && 'error' in actionData && (
          <div className="mx-6 mt-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
            {actionData.error}
          </div>
        )}

        {/* Form */}
        <Form ref={formRef} method="post" onSubmit={handleSubmit} className="p-6">
          {/* Hidden input for markdown content */}
          <input type="hidden" name="content" value={content} />
          {replyToId && <input type="hidden" name="replyToId" value={replyToId} />}

          {/* Rich Text Editor */}
          <div className="mb-3">
            <RichTextEditor
              value={editorValue}
              onChange={handleEditorChange}
              placeholder="What's on your mind?"
              autoFocus
              onSubmit={handleKeyboardSubmit}
            />
          </div>

          {/* Helper Text */}
          <div className="mb-3 text-sm text-gray-500">
            <span>Tip: Select text to format it with the inline toolbar</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'rounded-lg bg-wallie-accent px-6 py-2 text-sm font-semibold text-gray-900 transition-all',
                isSubmitting
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-wallie-accent-dim active:scale-95'
              )}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
