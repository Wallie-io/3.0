import { useState, useEffect } from 'react';

interface UnderDevelopmentProps {
  pageName: string;
}

export function UnderDevelopment({ pageName }: UnderDevelopmentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const storageKey = `under-dev-dismissed-${pageName}`;

  // Ensure we only run on the client after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if user has already dismissed this overlay
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey, mounted]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  // Don't render until mounted on client
  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-wallie-accent/10">
          <svg
            className="h-6 w-6 text-wallie-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>

        {/* Content */}
        <h2 className="mb-2 text-xl font-bold text-zinc-100">
          Under Development
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          The <span className="font-semibold text-wallie-accent">{pageName}</span> page is currently under development.
          Check back soon for updates!
        </p>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="w-full rounded-lg bg-wallie-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-wallie-accent-dim"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
