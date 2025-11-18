/**
 * PostCard Component
 * Displays a post with markdown content, stats, and actions
 */

import { Link, useFetcher } from 'react-router';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '~/lib/utils';
import type { PostWithStats } from '~/db/services/posts';

dayjs.extend(relativeTime);

// ============================================================================
// Types
// ============================================================================

interface PostCardProps {
  post: PostWithStats;
  featured?: boolean;
  userId?: string | null;
}

// ============================================================================
// Component
// ============================================================================

export function PostCard({ post, featured = false, userId }: PostCardProps) {
  const likeFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const [showLikesModal, setShowLikesModal] = useState(false);

  // Check if current user owns this post
  const isOwner = userId && post.author_id === userId;

  // Check if this is an anonymous post
  const isAnonymous = !!post.anonymousAuthor;

  // Show delete button for logged-in users (moderation)
  const canDelete = !!userId;

  // Anonymous likes stored in sessionStorage
  const [anonymousLikes, setAnonymousLikes] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = sessionStorage.getItem('anonymousLikes');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const isLikedAnonymously = anonymousLikes.has(post.id);

  // Optimistic like state
  const isLiked = likeFetcher.formData
    ? likeFetcher.formData.get('action') === 'like'
    : userId ? post.isLikedByUser : isLikedAnonymously;

  const likeCount = likeFetcher.formData
    ? post.likeCount + (likeFetcher.formData.get('action') === 'like' ? 1 : -1)
    : post.likeCount;

  // Handle like button click
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // For anonymous users, store likes in sessionStorage
    if (!userId) {
      const newLikes = new Set(anonymousLikes);
      if (isLikedAnonymously) {
        newLikes.delete(post.id);
      } else {
        newLikes.add(post.id);
      }
      setAnonymousLikes(newLikes);

      // Persist to sessionStorage
      try {
        sessionStorage.setItem('anonymousLikes', JSON.stringify(Array.from(newLikes)));
      } catch (error) {
        console.error('Failed to save anonymous likes:', error);
      }
      return;
    }

    // For logged-in users, submit to backend
    const formData = new FormData();
    formData.append('action', isLiked ? 'unlike' : 'like');

    likeFetcher.submit(formData, {
      method: 'post',
      action: `/api/posts/${post.id}/like`,
    });
  };

  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    deleteFetcher.submit(
      {},
      {
        method: 'post',
        action: `/api/posts/${post.id}/delete`,
      }
    );
  };

  return (
    <Link
      to={`/posts/${post.id}`}
      className={cn(
        'block rounded-xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-gray-700',
        featured && 'md:col-span-2'
      )}
    >
      {/* Reply Context */}
      {post.replyToContent && (
        <div className="mb-4 p-3 rounded-lg bg-wallie-charcoal/30 border border-white/5">
          <div className="text-xs text-wallie-text-tertiary mb-1">Replying to:</div>
          <div className="text-sm text-wallie-text-secondary italic">
            {post.replyToContent}
          </div>
        </div>
      )}

      {/* Author Info */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold',
            isAnonymous
              ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300'
              : 'bg-gradient-to-br from-wallie-accent to-wallie-purple text-gray-900',
            featured ? 'h-12 w-12' : 'h-10 w-10'
          )}
        >
          {post.author_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className={cn('font-semibold flex items-center gap-2', featured && 'text-lg')}>
            <span className={isAnonymous ? 'text-gray-400' : 'text-gray-100'}>
              {post.author_name}
            </span>
            {isAnonymous && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/50">
                Anonymous
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {post.createdAt ? dayjs(post.createdAt).fromNow() : 'Just now'}
          </div>
        </div>
      </div>

      {/* Post Content (Markdown) with height constraint */}
      <div
        className={cn(
          'prose prose-invert max-w-none mb-4 overflow-hidden',
          featured ? 'prose-lg max-h-[400px]' : 'prose-sm max-h-[200px]'
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {/* Show More Button - Appears if content is long */}
      {post.content && post.content.length > 200 && (
        <Link
          to={`/posts/${post.id}`}
          className="mb-4 inline-block text-sm font-medium text-wallie-accent hover:text-wallie-accent-dim transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Show more →
        </Link>
      )}

      {/* Post Actions */}
      <div className="flex items-center gap-4 border-t border-gray-800 pt-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isLiked
              ? 'bg-wallie-accent/10 text-wallie-accent'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
          )}
        >
          <svg
            className="h-5 w-5"
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{likeCount}</span>
        </button>

        {/* Reply Count */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.replyCount}</span>
        </div>

        {/* Share Button (placeholder) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>

        {/* Delete Button (for all logged-in users - moderation) */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleteFetcher.state !== 'idle'}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-red-900/20 hover:text-red-400 disabled:opacity-50"
            title={isOwner ? "Delete post" : "Delete post (moderation)"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </Link>
  );
}
