/**
 * @fileoverview Chat input component with auto-resizing textarea.
 *
 * Provides the message input area with send button.
 * Supports Enter to send and Shift+Enter for newlines.
 *
 * @module components/chat/ChatInput
 */

import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

interface ChatInputProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when message should be sent */
  onSend: () => void;
  /** Whether sending is disabled */
  disabled?: boolean;
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Chat input component with auto-resizing textarea.
 *
 * Features:
 * - Auto-resizing textarea (max 120px height)
 * - Enter to send, Shift+Enter for newline
 * - Send button with disabled state
 * - 512 character limit with visual counter
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  isMobile = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_LENGTH = 512;
  const remaining = MAX_LENGTH - value.length;
  const isNearLimit = remaining <= 50;

  // Auto-resize textarea as content changes (capped at 120px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={`${isMobile ? 'p-4 pb-6' : 'p-4'} relative z-20 border-t border-white/10 backdrop-blur-lg bg-white/5`}
    >
      <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'} items-end`}>
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            isMobile={isMobile}
            maxLength={MAX_LENGTH}
          />
          {value.length > 0 && (
            <div
              className={`absolute bottom-1 right-3 text-xs font-mono ${
                isNearLimit ? 'text-yellow-300' : 'text-white/40'
              }`}
            >
              {remaining}
            </div>
          )}
        </div>
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className={`bg-cyan-600 hover:bg-cyan-500 text-white border-0 rounded-full ${isMobile ? 'px-5' : 'px-4'} shadow-lg disabled:opacity-50`}
        >
          <Send className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
        </Button>
      </div>
    </div>
  );
}
