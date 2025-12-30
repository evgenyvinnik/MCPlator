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
  config: AutoPlayConfig = {},
  onAutoPlayStart?: () => void
) {
  const { typingSpeed = 50, sendDelay = 800 } = config;

  const [autoPlayMessage, setAutoPlayMessage] = useState<string>('');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(window.location.search);
  const playedMessagesRef = useRef(new Set<string>());
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const sendTimeoutRef = useRef<number | undefined>(undefined);

  // Monitor URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentUrl(window.location.search);
    };

    window.addEventListener('popstate', handleUrlChange);
    // Also check periodically in case URL changes without popstate
    const interval = setInterval(() => {
      if (window.location.search !== currentUrl) {
        setCurrentUrl(window.location.search);
      }
    }, 500);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(interval);
    };
  }, [currentUrl]);

  useEffect(() => {
    console.log('[LMCIFY] Effect running, currentUrl:', currentUrl);

    // Check for LMCIFY parameter in URL
    const sharedMessage = getLmcifyFromUrl(currentUrl);
    console.log('[LMCIFY] Decoded message:', sharedMessage);

    if (!sharedMessage) {
      console.log('[LMCIFY] No message found in URL');
      return;
    }

    // Check if we've already played this exact message
    if (playedMessagesRef.current.has(sharedMessage)) {
      console.log('[LMCIFY] Message already played, skipping');
      return;
    }

    console.log('[LMCIFY] Starting auto-play for message:', sharedMessage);

    // Mark this message as played
    playedMessagesRef.current.add(sharedMessage);
    setIsAutoPlaying(true);

    // Notify parent that auto-play is starting (e.g., to open chat panel)
    if (onAutoPlayStart) {
      onAutoPlayStart();
    }

    // Type the message character by character
    let currentIndex = 0;
    const typeNextCharacter = () => {
      if (currentIndex <= sharedMessage.length) {
        const partial = sharedMessage.slice(0, currentIndex);
        console.log('[LMCIFY] Typing character', currentIndex, ':', partial);
        setAutoPlayMessage(partial);
        currentIndex++;
        typingTimeoutRef.current = window.setTimeout(
          typeNextCharacter,
          typingSpeed
        );
      } else {
        // Typing complete, send the message after a delay
        console.log('[LMCIFY] Typing complete, sending message in', sendDelay, 'ms');
        sendTimeoutRef.current = window.setTimeout(() => {
          console.log('[LMCIFY] Sending message:', sharedMessage);
          onSend(sharedMessage);
          setIsAutoPlaying(false);

          // Clear URL parameter after sending (clean up URL)
          const url = new URL(window.location.href);
          url.searchParams.delete('lmcify');
          window.history.replaceState({}, '', url.toString());
          console.log('[LMCIFY] Auto-play complete, URL cleaned');
        }, sendDelay);
      }
    };

    // Start typing after a short delay
    console.log('[LMCIFY] Starting typing in 300ms');
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
  }, [currentUrl, onSend, typingSpeed, sendDelay, onAutoPlayStart]);

  return {
    autoPlayMessage,
    isAutoPlaying,
    setAutoPlayMessage,
  };
}
