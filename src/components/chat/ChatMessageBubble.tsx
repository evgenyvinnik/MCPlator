/**
 * @fileoverview Chat message bubble component.
 *
 * Displays a single chat message with role-based styling
 * for user and assistant messages.
 *
 * @module components/chat/ChatMessageBubble
 */

import { Card } from '../ui/Card';
import type { ChatRole } from '../../types/chat';
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
  const [isHovered, setIsHovered] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare();
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div
      className="max-w-[85%] flex items-start gap-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Share button - only show for user messages, appears on hover (desktop) or always visible (mobile) */}
      {role === 'user' && onShare && (
        <button
          onClick={handleShare}
          className={`mt-px flex-shrink-0 p-1.5 rounded-full transition-all duration-200 bg-cyan-500/30 hover:bg-cyan-500/50 relative ${
            isMobile || isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Share message"
          title="Share this calculation"
        >
          <Share2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-cyan-200`} />
          {showCopied && (
            <div className="absolute top-0 right-full mr-2 px-2 py-1 bg-emerald-500 text-white text-xs rounded whitespace-nowrap">
              Link copied!
            </div>
          )}
        </button>
      )}

      <Card
        className={`${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl ${
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
