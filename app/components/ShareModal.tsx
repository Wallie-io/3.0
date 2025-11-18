/**
 * ShareModal Component
 * Modal for copying post links
 */

import { useState } from "react";
import { cn } from "~/lib/utils";
import { Check, Copy } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function ShareModal({ isOpen, onClose, postId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${postId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-wallie-charcoal border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-wallie-text-primary mb-4">
          Share post
        </h3>
        <p className="text-wallie-text-secondary mb-6">
          Copy the link to share this post
        </p>

        {/* URL Display */}
        <div className="mb-6 p-3 rounded-lg bg-wallie-dark border border-white/5 text-wallie-text-secondary text-sm break-all">
          {postUrl}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg",
              "text-wallie-text-secondary border border-white/20",
              "hover:bg-wallie-dark hover:text-wallie-text-primary",
              "transition-all duration-200"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={copied}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2",
              copied
                ? "bg-wallie-success text-white"
                : "bg-wallie-accent text-wallie-dark shadow-lg shadow-wallie-accent/30 hover:shadow-xl hover:shadow-wallie-accent/40",
              "transition-all duration-200",
              "disabled:opacity-100"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
