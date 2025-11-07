import { useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/_dashboard.messages.new";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Chat - Messages - Wallie" },
    { name: "description", content: "Start a new conversation" },
  ];
}

export default function NewChatModal() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Close modal
  const handleClose = () => {
    navigate("/messages");
  };

  // Search users as they type
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      const result = await response.json();
      setSearchResults(result.data || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Start chat with selected user
  const handleStartChat = async (userId: string) => {
    setIsCreatingThread(true);
    try {
      const response = await fetch("/api/messages/threads/create", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ recipientId: userId }),
      });

      const result = await response.json();

      if (result.success && result.threadId) {
        navigate(`/messages/${result.threadId}`);
      } else {
        alert(result.error || "Failed to start chat");
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
      alert("Failed to start chat");
    } finally {
      setIsCreatingThread(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-wallie-darker rounded-2xl shadow-wallie-xl border border-white/10 max-w-lg w-full max-h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-wallie-charcoal/50">
          <h2 className="text-xl font-bold text-wallie-text-primary">New Chat</h2>
          <p className="text-sm text-wallie-text-secondary mt-1">Search for a user to start chatting</p>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-wallie-charcoal/50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username..."
            autoFocus
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-wallie-charcoal/50 border border-white/10",
              "text-wallie-text-primary placeholder:text-wallie-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-wallie-accent focus:border-transparent"
            )}
          />
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="p-12 text-center">
              <p className="text-wallie-text-secondary">Searching...</p>
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="p-12 text-center">
              <p className="text-wallie-text-secondary">Type at least 2 characters to search</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-wallie-text-secondary">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-wallie-charcoal/50">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  disabled={isCreatingThread}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 hover:bg-wallie-charcoal/30 transition-all duration-200 text-left",
                    isCreatingThread && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-wallie-accent flex items-center justify-center text-wallie-dark font-bold text-lg flex-shrink-0 shadow-wallie-glow-accent">
                    {user.displayName[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-wallie-text-primary truncate">
                      {user.displayName}
                    </h3>
                    {user.username && (
                      <p className="text-sm text-wallie-text-tertiary truncate">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-wallie-text-tertiary truncate mt-1">{user.bio}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-wallie-charcoal/50">
          <button
            onClick={handleClose}
            className={cn(
              "w-full px-4 py-2 rounded-lg font-medium",
              "bg-wallie-charcoal/50 text-wallie-text-secondary",
              "hover:bg-wallie-charcoal",
              "transition-colors duration-200"
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
