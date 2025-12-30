/**
 * @fileoverview Chat message bubble component.
 *
 * Displays a single chat message with role-based styling
 * for user and assistant messages.
 *
 * @module components/chat/ChatMessageBubble
 */

import { Card } from '../ui/Card';
import type { ChatRole } from '../../types';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageBubbleProps {
  /** The message text */
  text: string;
  /** Message sender role */
  role: ChatRole;
  /** ISO timestamp for when the message was created */
  createdAt: string;
  /** Whether in mobile layout mode */
  isMobile?: boolean;
  /** Callback when share button is clicked (only for user messages) */
  onShare?: () => void;
}

/**
 * Displays a chat message bubble with role-based styling.
 *
 * - User messages: Cyan background, right-aligned, with share button
 * - Assistant messages: Semi-transparent white, left-aligned
 */
export function ChatMessageBubble({
  text,
  role,
  createdAt,
  isMobile = false,
  onShare,
}: ChatMessageBubbleProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Share button - only show for user messages */}
      {role === 'user' && onShare && (
        <button
          onClick={handleShare}
          className="flex-shrink-0 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group relative"
          aria-label="Share message"
          title="Share this calculation"
        >
          <Share2 className="w-4 h-4 text-white/60 group-hover:text-white/90" />
          {showCopied && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-white text-xs rounded whitespace-nowrap">
              Link copied!
            </div>
          )}
        </button>
      )}

      <Card
        className={`max-w-[85%] ${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl ${
          role === 'user'
            ? 'bg-cyan-600/80 text-white'
            : 'bg-white/10 text-white border border-white/20'
        }`}
      >
        <p
          className={`${isMobile ? 'text-lg' : 'text-base'} break-words overflow-hidden`}
        >
          {text}
        </p>
        <p className={`${isMobile ? 'text-base' : 'text-sm'} opacity-70 mt-1`}>
          {new Date(createdAt).toLocaleTimeString()}
        </p>
      </Card>
    </div>
  );
}
