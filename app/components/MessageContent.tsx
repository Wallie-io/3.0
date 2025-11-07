/**
 * MessageContent Component
 * Renders message text with embedded images
 */

import { useState, useEffect } from 'react';
import { parseMessageContent, type MessagePart } from '~/lib/message-parser';

interface MessageContentProps {
  content: string;
  isCurrentUser?: boolean;
}

interface EmbeddedImageProps {
  imageId: string;
}

function EmbeddedImage({ imageId }: EmbeddedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch image URL from API
    fetch(`/api/images/${imageId}?size=medium`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load image');
        return res.json();
      })
      .then((data) => {
        setImageUrl(data.imageUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading image:', err);
        setError(true);
        setLoading(false);
      });
  }, [imageId]);

  if (loading) {
    return (
      <div className="inline-block my-2 w-full max-w-sm h-48 rounded-lg bg-wallie-charcoal/30 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-wallie-accent/30 border-t-wallie-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="inline-block my-2 w-full max-w-sm p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-400 text-sm">
        Failed to load image
      </div>
    );
  }

  return (
    <div className="my-2 w-full">
      <img
        src={imageUrl}
        alt="Shared image"
        className="max-w-full h-auto rounded-lg border border-white/10 shadow-lg"
        loading="lazy"
      />
    </div>
  );
}

export function MessageContent({ content, isCurrentUser = false }: MessageContentProps) {
  const parts = parseMessageContent(content);

  return (
    <div className="break-words">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {part.content}
            </span>
          );
        } else if (part.type === 'image') {
          return <EmbeddedImage key={index} imageId={part.imageId} />;
        }
        return null;
      })}
    </div>
  );
}
