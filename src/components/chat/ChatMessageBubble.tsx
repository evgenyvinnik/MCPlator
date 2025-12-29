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

interface ChatMessageBubbleProps {
  /** The message text */
  text: string;
  /** Message sender role */
  role: ChatRole;
  /** ISO timestamp for when the message was created */
  createdAt: string;
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Displays a chat message bubble with role-based styling.
 *
 * - User messages: Cyan background, right-aligned
 * - Assistant messages: Semi-transparent white, left-aligned
 */
export function ChatMessageBubble({
  text,
  role,
  createdAt,
  isMobile = false,
}: ChatMessageBubbleProps) {
  return (
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
  );
}
