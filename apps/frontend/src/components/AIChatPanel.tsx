/**
 * @fileoverview AI Chat panel component for calculator interaction.
 *
 * Provides a chat interface for users to interact with the AI assistant.
 * Supports both desktop sidebar and mobile bottom sheet layouts.
 * Features real-time streaming responses and calculator result display.
 *
 * @module components/AIChatPanel
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Send, MessageSquare, ChevronDown } from 'lucide-react';
import { useChatStore } from '../state/useChatStore';
import { useStreamingChat } from '../api/useStreamingChat';

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
 * - Auto-resizing textarea input (max 120px)
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content changes (capped at 120px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if ((messages.length > 0 || streamingMessage) && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  /**
   * Sends the current input message to the AI.
   * Clears input, closes mobile sheet during processing,
   * and reopens when response arrives.
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;

    const text = inputText;
    setInputText('');

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

  /**
   * Handles keyboard events on the textarea.
   * Enter sends message, Shift+Enter adds newline.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

      {/* Header */}
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
              className={`text-white ${isMobile ? 'text-lg font-semibold' : ''}`}
            >
              AI Assistant
            </h2>
            <p
              className={`text-cyan-300 ${isMobile ? 'text-base' : 'text-xs'}`}
            >
              Let me calculate it for you
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
              } else if (onToggle) {
                onToggle();
              } else {
                setIsMinimized(true);
              }
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label={isMinimized ? 'Maximize chat' : 'Close chat'}
          >
            <ChevronDown
              className={`w-5 h-5 text-white transition-transform ${isMinimized ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Chat Messages - Hidden when minimized */}
      {!isMinimized && (
        <>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10"
          >
            {messages.length === 0 && !streamingMessage && (
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
                    className={`text-white ${isMobile ? 'text-xl font-medium' : ''}`}
                  >
                    Start a conversation
                  </p>
                  <p
                    className={`text-cyan-300 ${isMobile ? 'text-lg' : 'text-sm'} mt-2`}
                  >
                    Ask me to perform calculator operations!
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'result' ? (
                  // Result message - special styling with bold text
                  <Card
                    className={`max-w-[85%] ${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/40`}
                  >
                    <p
                      className={`${isMobile ? 'text-base' : 'text-xs'} text-emerald-300 uppercase tracking-wider mb-1`}
                    >
                      Result
                    </p>
                    <p
                      className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-white font-mono`}
                    >
                      {message.text}
                    </p>
                  </Card>
                ) : (
                  // Regular message
                  <Card
                    className={`max-w-[85%] ${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl ${
                      message.role === 'user'
                        ? 'bg-cyan-600/80 text-white'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}
                  >
                    <p className={isMobile ? 'text-base' : 'text-sm'}>
                      {message.text}
                    </p>
                    <p
                      className={`${isMobile ? 'text-base' : 'text-xs'} opacity-70 mt-1`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </Card>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <Card
                  className={`max-w-[85%] ${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl bg-white/10 text-white border border-white/20`}
                >
                  <p className={isMobile ? 'text-base' : 'text-sm'}>
                    {streamingMessage.text}
                  </p>
                  {isThinking && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  )}
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div
            className={`${isMobile ? 'p-5' : 'p-4'} relative z-20 border-t border-white/10 backdrop-blur-lg bg-white/5`}
          >
            {/* <Card
              className={`backdrop-blur-lg bg-white/10 border border-white/20 ${isMobile ? 'p-4' : 'p-3'} shadow-xl`}
            > */}
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  isMobile={isMobile}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isStreaming}
                  className={`bg-cyan-600 hover:bg-cyan-500 text-white border-0 rounded-full ${isMobile ? 'px-5' : 'px-4'} shadow-lg disabled:opacity-50`}
                >
                  <Send className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                </Button>
              </div>
            {/* </Card> */}
          </div>
        </>
      )}
    </div>
  );
}
