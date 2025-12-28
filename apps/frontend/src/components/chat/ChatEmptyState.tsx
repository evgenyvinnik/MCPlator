/**
 * @fileoverview Empty state component for the chat panel.
 *
 * Displayed when there are no messages in the chat.
 *
 * @module components/chat/ChatEmptyState
 */

import { MessageSquare } from 'lucide-react';

interface ChatEmptyStateProps {
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Empty state shown when no messages exist.
 *
 * Features:
 * - Centered icon with glassmorphism effect
 * - "Start a conversation" prompt
 * - Helpful subtitle text
 */
export function ChatEmptyState({ isMobile = false }: ChatEmptyStateProps) {
  return (
    <div className="text-center py-12 space-y-4">
      <div
        className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} mx-auto rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center backdrop-blur-lg`}
      >
        <MessageSquare
          className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-cyan-300`}
        />
      </div>
      <div>
        <p
          className={`text-white ${isMobile ? 'text-2xl font-medium' : 'text-lg'}`}
        >
          Start a conversation
        </p>
        <p
          className={`text-cyan-300 ${isMobile ? 'text-xl' : 'text-base'} mt-2`}
        >
          Ask me to perform calculator operations!
        </p>
      </div>
    </div>
  );
}
