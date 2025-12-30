/**
 * @fileoverview LMCIFY - Let Me Calculate It For You
 *
 * Utilities for creating shareable calculation links.
 * Encodes messages to base64 for URL sharing.
 *
 * @module utils/lmcify
 */

/**
 * Encodes a message to base64 for URL sharing.
 *
 * @param message - The message text to encode
 * @returns Base64-encoded message safe for URLs
 *
 * @example
 * ```ts
 * const encoded = encodeLmcify("Calculate 5 + 3");
 * // Returns: "Q2FsY3VsYXRlIDUgKyAz"
 * ```
 */
export function encodeLmcify(message: string): string {
  // Convert to base64 and make URL-safe by replacing +, /, and =
  return btoa(encodeURIComponent(message))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodes a base64-encoded LMCIFY message from URL.
 *
 * @param encoded - The base64-encoded message from URL
 * @returns Decoded message text, or null if invalid
 *
 * @example
 * ```ts
 * const message = decodeLmcify("Q2FsY3VsYXRlIDUgKyAz");
 * // Returns: "Calculate 5 + 3"
 * ```
 */
export function decodeLmcify(encoded: string): string | null {
  try {
    // Restore URL-safe base64 to standard base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      // Re-add padding if needed
      + '==='.slice((encoded.length + 3) % 4);

    return decodeURIComponent(atob(base64));
  } catch (error) {
    console.error('Failed to decode LMCIFY message:', error);
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
