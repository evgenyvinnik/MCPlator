/**
 * @fileoverview LMCIFY - Let Me Calculate It For You
 *
 * Utilities for creating shareable calculation links.
 * Uses lz-string compression for shorter URLs.
 *
 * @module utils/lmcify
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

/**
 * Encodes a message using lz-string compression for URL sharing.
 *
 * @param message - The message text to encode
 * @returns Compressed, URL-safe encoded message
 *
 * @example
 * ```ts
 * const encoded = encodeLmcify("Calculate 5 + 3");
 * ```
 */
export function encodeLmcify(message: string): string {
  return compressToEncodedURIComponent(message);
}

/**
 * Decodes a compressed LMCIFY message from URL.
 *
 * @param encoded - The compressed message from URL
 * @returns Decoded message text, or null if invalid
 *
 * @example
 * ```ts
 * const message = decodeLmcify(encoded);
 * // Returns: "Calculate 5 + 3"
 * ```
 */
export function decodeLmcify(encoded: string): string | null {
  try {
    const result = decompressFromEncodedURIComponent(encoded);
    return result || null;
  } catch {
    return null;
  }
}

/**
 * Generates a shareable LMCIFY link for a message.
 *
 * @param message - The message text to share
 * @param baseUrl - The base URL (defaults to current origin)
 * @returns Full shareable URL with encoded message
 *
 * @example
 * ```ts
 * const link = generateLmcifyLink("What's 15% of 200?");
 * // Returns: "https://mcplator.vercel.app/?lmcify=V2hhdCdzIDE1JSBvZiAyMDA_"
 * ```
 */
export function generateLmcifyLink(
  message: string,
  baseUrl: string = window.location.origin
): string {
  const encoded = encodeLmcify(message);
  return `${baseUrl}/?lmcify=${encoded}`;
}

/**
 * Extracts and decodes LMCIFY parameter from URL.
 *
 * @param url - URL string or URLSearchParams to parse
 * @returns Decoded message or null if no valid lmcify parameter
 *
 * @example
 * ```ts
 * const message = getLmcifyFromUrl(window.location.search);
 * if (message) {
 *   console.log('Shared message:', message);
 * }
 * ```
 */
export function getLmcifyFromUrl(
  url: string | URLSearchParams = window.location.search
): string | null {
  const params = typeof url === 'string' ? new URLSearchParams(url) : url;
  const encoded = params.get('lmcify');

  if (!encoded) {
    return null;
  }

  return decodeLmcify(encoded);
}
