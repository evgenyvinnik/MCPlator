/**
 * @fileoverview Hook for LMCIFY auto-play functionality.
 *
 * Handles automatic message playback when a shared link is opened.
 * Types the message character-by-character and sends it automatically.
 *
 * @module hooks/useLmcifyAutoPlay
 */

import { useEffect, useRef, useState } from 'react';
import { getLmcifyFromUrl } from '../utils/lmcify';

/**
 * Configuration for auto-play behavior.
 */
interface AutoPlayConfig {
  /** Milliseconds between each character when typing */
  typingSpeed?: number;
  /** Milliseconds to wait before sending after typing completes */
  sendDelay?: number;
}

/**
 * Hook for handling LMCIFY auto-play functionality.
 *
 * Detects shared messages from URL and automatically types and sends them.
 * Only runs once on mount to avoid repeated playback.
 *
 * @param onSend - Callback to send the message after typing
 * @param config - Configuration for typing speed and send delay
 * @returns Object containing current typing state and auto-play status
 *
 * @example
 * ```tsx
 * const { autoPlayMessage, isAutoPlaying, setAutoPlayMessage } = useLmcifyAutoPlay(
 *   handleSendMessage,
 *   { typingSpeed: 50, sendDelay: 500 }
 * );
 *
 * // In your input component:
 * <input value={autoPlayMessage || inputText} />
 * ```
 */
export function useLmcifyAutoPlay(
  onSend: (message: string) => void,
  config: AutoPlayConfig = {}
) {
  const { typingSpeed = 50, sendDelay = 800 } = config;

  const [autoPlayMessage, setAutoPlayMessage] = useState<string>('');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const hasAutoPlayedRef = useRef(false);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const sendTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Only auto-play once per session
    if (hasAutoPlayedRef.current) {
      return;
    }

    // Check for LMCIFY parameter in URL
    const sharedMessage = getLmcifyFromUrl(window.location.search);
    if (!sharedMessage) {
      return;
    }

    hasAutoPlayedRef.current = true;
    setIsAutoPlaying(true);

    // Type the message character by character
    let currentIndex = 0;
    const typeNextCharacter = () => {
      if (currentIndex <= sharedMessage.length) {
        setAutoPlayMessage(sharedMessage.slice(0, currentIndex));
        currentIndex++;
        typingTimeoutRef.current = window.setTimeout(
          typeNextCharacter,
          typingSpeed
        );
      } else {
        // Typing complete, send the message after a delay
        sendTimeoutRef.current = window.setTimeout(() => {
          onSend(sharedMessage);
          setIsAutoPlaying(false);

          // Clear URL parameter after sending (clean up URL)
          const url = new URL(window.location.href);
          url.searchParams.delete('lmcify');
          window.history.replaceState({}, '', url.toString());
        }, sendDelay);
      }
    };

    // Start typing after a short delay
    typingTimeoutRef.current = window.setTimeout(typeNextCharacter, 300);

    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, [onSend, typingSpeed, sendDelay]);

  return {
    autoPlayMessage,
    isAutoPlaying,
    setAutoPlayMessage,
  };
}
