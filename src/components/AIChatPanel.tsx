/**
 * @fileoverview AI Chat panel component for calculator interaction.
 *
 * Provides a chat interface for users to interact with the AI assistant.
 * Supports both desktop sidebar and mobile bottom sheet layouts.
 * Features real-time streaming responses and calculator result display.
 *
 * @module components/AIChatPanel
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../state/useChatStore';
import { useStreamingChat } from '../api/useStreamingChat';
import { ChatEmptyState } from './chat/ChatEmptyState';
import { ChatHeader } from './chat/ChatHeader';
import { ChatInput } from './chat/ChatInput';
import { ChatMessageBubble } from './chat/ChatMessageBubble';
import { ResultCard } from './chat/ResultCard';
import { StreamingMessage } from './chat/StreamingMessage';
import { generateLmcifyLink } from '../utils/lmcify';
import { useLmcifyAutoPlay } from '../hooks/useLmcifyAutoPlay';

/**
 * Props for the AIChatPanel component.
 */
interface AIChatPanelProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to render in mobile layout mode */
  isMobile?: boolean;
  /** Callback to close/toggle the chat panel (mobile) */
  onToggle?: () => void;
  /** Callback to open the chat panel (mobile) */
  onOpen?: () => void;
}

/**
 * AI Chat panel for interacting with the calculator assistant.
 *
 * Features:
 * - Message history with user and assistant bubbles
 * - Real-time streaming response display
 * - Thinking indicator with pulsing dots
 * - Special "result" message styling for calculator outputs
 * - Auto-scrolling to latest message
 * - Enter to send, Shift+Enter for newline
 * - Mobile bottom sheet layout with minimize/close
 * - Glassmorphism styling with backdrop blur
 *
 * @param props - Component props
 * @returns The rendered chat panel
 *
 * @example
 * ```tsx
 * // Desktop sidebar
 * <AIChatPanel />
 *
 * // Mobile bottom sheet
 * <AIChatPanel
 *   isMobile={true}
 *   onToggle={() => setIsChatOpen(false)}
 *   onOpen={() => setIsChatOpen(true)}
 * />
 * ```
 */
export function AIChatPanel({
  className = '',
  isMobile = false,
  onToggle,
  onOpen,
}: AIChatPanelProps) {
  const { messages, streamingMessage, isThinking } = useChatStore();
  const { sendChat, isStreaming } = useStreamingChat();
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Sends a message to the AI (used by both manual and auto-play).
   */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // On mobile, close the bottom sheet while processing
    if (isMobile && onToggle) {
      onToggle();
    }

    await sendChat(text);

    // On mobile, re-open the bottom sheet when response is received
    if (isMobile && onOpen) {
      onOpen();
    }
  };

  // Initialize auto-play for shared links
  const { autoPlayMessage, isAutoPlaying } = useLmcifyAutoPlay(
    sendMessage,
    {
      typingSpeed: 100,
      sendDelay: 1000,
    },
    () => {
      // When auto-play starts, open the chat panel on mobile
      if (isMobile && onOpen) {
        onOpen();
      }
    }
  );

  // Sync auto-play message with input text
  useEffect(() => {
    if (isAutoPlaying && autoPlayMessage) {
      setInputText(autoPlayMessage);
    } else if (!isAutoPlaying && !autoPlayMessage) {
      // Clear input after auto-play completes
      setInputText('');
    }
  }, [autoPlayMessage, isAutoPlaying]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if ((messages.length > 0 || streamingMessage) && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  /**
   * Sends the current input message to the AI.
   * Clears input after sending.
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;

    const text = inputText;
    setInputText('');

    await sendMessage(text);
  };

  /**
   * Handles minimize/close toggle for mobile layout.
   */
  const handleMinimizeToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else if (onToggle) {
      onToggle();
    } else {
      setIsMinimized(true);
    }
  };

  /**
   * Handles sharing a message via LMCIFY link.
   * Generates a shareable link and copies it to clipboard.
   */
  const handleShareMessage = (messageText: string) => {
    const link = generateLmcifyLink(messageText);
    navigator.clipboard.writeText(link).catch((err) => {
      console.error('Failed to copy link:', err);
    });
  };

  return (
    <div
      className={`relative h-full w-full bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-800 shadow-2xl flex flex-col overflow-hidden ${
        isMobile
          ? `rounded-t-[28px] rounded-b-none ${isMinimized ? 'h-20' : ''}`
          : 'rounded-[28px]'
      } ${className}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/20 to-blue-700/20"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-xl"></div>

      <ChatHeader
        isMobile={isMobile}
        isMinimized={isMinimized}
        onMinimizeToggle={handleMinimizeToggle}
      />

      {/* Chat Messages - Hidden when minimized */}
      {!isMinimized && (
        <>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10"
          >
            {messages.length === 0 && !streamingMessage && (
              <ChatEmptyState isMobile={isMobile} />
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'result' ? (
                  <ResultCard
                    text={message.text}
                    keys={message.keys}
                    isMobile={isMobile}
                  />
                ) : (
                  <ChatMessageBubble
                    text={message.text}
                    role={message.role}
                    createdAt={message.createdAt}
                    isMobile={isMobile}
                    onShare={
                      message.role === 'user'
                        ? () => handleShareMessage(message.text)
                        : undefined
                    }
                  />
                )}
              </div>
            ))}

            {streamingMessage && (
              <StreamingMessage
                text={streamingMessage.text}
                isThinking={isThinking}
                isMobile={isMobile}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            value={inputText}
            onChange={setInputText}
            onSend={handleSendMessage}
            disabled={isStreaming || isAutoPlaying}
            isMobile={isMobile}
          />
        </>
      )}
    </div>
  );
}
