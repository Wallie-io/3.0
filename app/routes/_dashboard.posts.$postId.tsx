/**
 * Post Detail Route
 * View a single post with its replies and nested navigation
 */

import { data } from 'react-router';
import { Link, useNavigate, useLoaderData } from 'react-router';
import type { Route } from './+types/_dashboard.posts.$postId';
import { getPostWithStats, getRepliesForPost } from '~/db/services/posts';
import { getUserId } from '~/lib/session.server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '~/lib/utils';

dayjs.extend(relativeTime);

// ============================================================================
// Loader
// ============================================================================

export async function loader({ params, request }: Route.LoaderArgs) {
  const postId = params.postId;
  const userId = await getUserId(request);

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
// Component
// ============================================================================

export default function PostDetail() {
  const { post, replies, userId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-100">Post</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Main Post */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
          {/* Author Info */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-wallie-accent to-wallie-purple flex items-center justify-center text-gray-900 font-bold">
              {post.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-100">{post.author_name}</div>
              <div className="text-sm text-gray-500">
                {post.createdAt ? dayjs(post.createdAt).fromNow() : 'Just now'}
              </div>
            </div>
          </div>

          {/* Post Content (Markdown) */}
          <div className="prose prose-invert max-w-none mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* Post Stats & Actions */}
          <div className="flex items-center gap-6 border-t border-gray-800 pt-4">
            <button
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                post.isLikedByUser
                  ? 'bg-wallie-accent/10 text-wallie-accent'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              )}
            >
              <svg className="h-5 w-5" fill={post.isLikedByUser ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likeCount}</span>
            </button>

            <Link
              to={`/posts/new?replyTo=${post.id}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Reply</span>
            </Link>
          </div>
        </div>

        {/* Replies Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-100">
            {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}` : 'No replies yet'}
          </h2>

          {replies.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">Be the first to reply!</p>
            </div>
          ) : (
            replies.map((reply) => (
              <Link
                key={reply.id}
                to={`/posts/${reply.id}`}
                className="block rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700"
              >
                {/* Reply Author */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-wallie-purple to-wallie-pink flex items-center justify-center text-gray-900 font-bold text-sm">
                    {reply.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-100">{reply.author_name}</div>
                    <div className="text-xs text-gray-500">
                      {reply.createdAt ? dayjs(reply.createdAt).fromNow() : 'Just now'}
                    </div>
                  </div>
                </div>

                {/* Reply Content (Markdown preview - truncated) */}
                <div className="prose prose-invert prose-sm max-w-none line-clamp-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
