/**
 * @fileoverview Chat panel header component.
 *
 * Displays the AI Assistant title and provides
 * minimize/close controls for mobile layout.
 *
 * @module components/chat/ChatHeader
 */

import { MessageSquare, ChevronDown } from 'lucide-react';

interface ChatHeaderProps {
  /** Whether in mobile layout mode */
  isMobile?: boolean;
  /** Whether the chat is minimized (mobile only) */
  isMinimized?: boolean;
  /** Callback when minimize/close button is clicked */
  onMinimizeToggle?: () => void;
}

/**
 * Header component for the chat panel.
 *
 * Features:
 * - AI Assistant icon and title
 * - Subtitle text
 * - Minimize/close button (mobile only)
 */
export function ChatHeader({
  isMobile = false,
  isMinimized = false,
  onMinimizeToggle,
}: ChatHeaderProps) {
  return (
    <div className="relative z-20 flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-lg bg-white/5">
      <div className="flex items-center gap-3">
        <div
          className={`${isMobile ? 'w-16 h-16' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0`}
        >
          <MessageSquare
            className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} text-white`}
          />
        </div>
        <div>
          <h2
            className={`text-white ${isMobile ? 'text-xl font-semibold' : 'text-lg'}`}
          >
            AI Assistant
          </h2>
          <p className={`text-cyan-300 ${isMobile ? 'text-lg' : 'text-sm'}`}>
            Let me calculate it for you
          </p>
        </div>
      </div>
      {isMobile && onMinimizeToggle && (
        <button
          onClick={onMinimizeToggle}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label={isMinimized ? 'Maximize chat' : 'Close chat'}
        >
          <ChevronDown
            className={`w-5 h-5 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
