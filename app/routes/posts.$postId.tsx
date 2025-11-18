/**
 * Public Post Detail Route
 * View a single post with its replies
 * Accessible to both anonymous and logged-in users
 */

import { data, redirect } from 'react-router';
import { Link, useNavigate, useLoaderData, useFetcher, Form } from 'react-router';
import type { Route } from './+types/posts.$postId';
import { getPostWithStats, getRepliesForPost, createPost } from '~/db/services/posts';
import { getUserId } from '~/lib/session.server';
import { getAnonymousUsername } from '~/lib/anonymous-user';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '~/lib/utils';
import { PostCard } from '~/components/PostCard';

dayjs.extend(relativeTime);

// ============================================================================
// Loader
// ============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  const postId = params.postId;
  const userId = await getUserId(request);

  // Redirect logged-in users to dashboard version
  if (userId) {
    return redirect(`/posts/${postId}`);
  }

  // Get the post with stats
  const post = await getPostWithStats(postId, userId || undefined);

  if (!post) {
    throw data({ message: 'Post not found' }, { status: 404 });
  }

  // Get replies for this post
  const replies = await getRepliesForPost(postId);

  return data({ post, replies, userId });
}

// ============================================================================
// Action - Handle reply submission
// ============================================================================

export async function action({ params, request }: Route.ActionArgs) {
  const postId = params.postId;
  const userId = await getUserId(request);
  const formData = await request.formData();
  const content = formData.get('content') as string;

  if (!content || content.trim().length === 0) {
    return data(
      { error: 'Content is required', success: false },
      { status: 400 }
    );
  }

  try {
    // Create reply
    if (userId) {
      // Logged-in user
      await createPost({
        authorId: userId,
        content,
        replyToId: postId,
      });
    } else {
      // Anonymous user
      const anonymousUsername = getAnonymousUsername(request);
      await createPost({
        anonymousAuthor: anonymousUsername,
        content,
        replyToId: postId,
      });
    }

    return redirect(`/posts/${postId}`);
  } catch (error) {
    console.error('Failed to create reply:', error);
    return data(
      {
        error: `Failed to create reply: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Component
// ============================================================================

export default function PublicPostDetail() {
  const { post, replies, userId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-wallie-dark text-wallie-text-primary">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-wallie-dark/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-wallie-accent to-wallie-purple bg-clip-text text-transparent font-display">
                Wallie
              </div>
            </Link>
            <Link
              to="/about"
              className="text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className={cn(
                "px-6 py-2 rounded-lg font-semibold",
                "bg-wallie-pink text-white",
                "shadow-lg shadow-wallie-pink/30",
                "hover:shadow-xl hover:shadow-wallie-pink/40",
                "transition-all duration-200"
              )}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-wallie-text-secondary hover:text-wallie-text-primary transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to feed</span>
          </button>

          {/* Main Post */}
          <div className="mb-8">
            <PostCard post={post} userId={userId} featured={false} />
          </div>

          {/* Reply Form */}
          <div className="mb-8">
            <Form method="post" className="space-y-4">
              <textarea
                name="content"
                placeholder="Write a reply..."
                className={cn(
                  "w-full p-4 rounded-xl border border-white/10",
                  "bg-wallie-charcoal text-wallie-text-primary",
                  "placeholder:text-wallie-text-tertiary",
                  "focus:outline-none focus:ring-2 focus:ring-wallie-accent",
                  "resize-none"
                )}
                rows={4}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={cn(
                    "px-6 py-2 rounded-lg font-semibold",
                    "bg-wallie-accent text-wallie-dark",
                    "shadow-lg shadow-wallie-accent/30",
                    "hover:shadow-xl hover:shadow-wallie-accent/40",
                    "transition-all duration-200"
                  )}
                >
                  Reply
                </button>
              </div>
            </Form>
          </div>

          {/* Replies */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-wallie-text-primary">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            {replies.map((reply) => (
              <PostCard
                key={reply.id}
                post={{
                  ...reply,
                  likeCount: 0,
                  replyCount: 0,
                  isLikedByUser: false,
                }}
                userId={userId}
                featured={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
