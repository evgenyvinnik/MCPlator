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
  /** Milliseconds between each character when typing (for short messages) */
  typingSpeed?: number;
  /** Milliseconds to wait before sending after typing completes */
  sendDelay?: number;
}

/**
 * Calculate dynamic typing speed based on message length.
 * Short messages (≤50 chars) use the base speed.
 * Longer messages progressively speed up to keep total time reasonable.
 *
 * @param messageLength - Length of the message in characters
 * @param baseSpeed - Base typing speed in ms (used for short messages)
 * @returns Calculated typing speed in ms per character
 */
function calculateTypingSpeed(messageLength: number, baseSpeed: number): number {
  const shortMessageThreshold = 50;
  const minSpeed = 10; // Minimum ms per character (fastest)

  if (messageLength <= shortMessageThreshold) {
    return baseSpeed;
  }

  // For longer messages, scale down the speed
  // Target: ~3 seconds total typing time for messages over threshold
  // This gives a smooth experience without being too slow
  const targetTotalTime = 3000; // ms
  const calculatedSpeed = targetTotalTime / messageLength;

  // Clamp between minSpeed and baseSpeed
  return Math.max(minSpeed, Math.min(baseSpeed, calculatedSpeed));
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
    // Check for LMCIFY parameter in URL
    const sharedMessage = getLmcifyFromUrl(currentUrl);

    if (!sharedMessage) {
      return;
    }

    // Check if we've already played this exact message
    if (playedMessagesRef.current.has(sharedMessage)) {
      return;
    }

    setIsAutoPlaying(true);

    // Notify parent that auto-play is starting (e.g., to open chat panel)
    if (onAutoPlayStart) {
      onAutoPlayStart();
    }

    // Type the message character by character
    let currentIndex = 0;
    const dynamicTypingSpeed = calculateTypingSpeed(sharedMessage.length, typingSpeed);

    const typeNextCharacter = () => {
      if (currentIndex <= sharedMessage.length) {
        const partial = sharedMessage.slice(0, currentIndex);
        setAutoPlayMessage(partial);
        currentIndex++;
        typingTimeoutRef.current = window.setTimeout(
          typeNextCharacter,
          dynamicTypingSpeed
        );
      } else {
        // Typing complete, send the message after a delay
        sendTimeoutRef.current = window.setTimeout(() => {
          onSend(sharedMessage);

          // Clear the auto-play message
          setAutoPlayMessage('');
          setIsAutoPlaying(false);

          // Mark this message as played AFTER successfully sending
          playedMessagesRef.current.add(sharedMessage);

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
  }, [currentUrl, onSend, typingSpeed, sendDelay, onAutoPlayStart]);

  return {
    autoPlayMessage,
    isAutoPlaying,
    setAutoPlayMessage,
  };
}
