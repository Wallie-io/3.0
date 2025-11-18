/**
 * LoginRequiredModal Component
 * Shown to anonymous users when they try to create posts
 */

import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  if (!isOpen) return null;

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
          Sign in to create posts
        </h3>
        <p className="text-wallie-text-secondary mb-6">
          You need to be signed in to create posts. Sign in or create an account to join the conversation.
        </p>
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
          <Link
            to="/login"
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-center font-semibold",
              "bg-wallie-pink text-white",
              "shadow-lg shadow-wallie-pink/30",
              "hover:shadow-xl hover:shadow-wallie-pink/40",
              "transition-all duration-200"
            )}
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
