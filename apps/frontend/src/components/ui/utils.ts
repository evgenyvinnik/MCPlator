/**
 * @fileoverview Utility functions for UI components.
 *
 * Provides the cn() helper for safely merging Tailwind CSS classes.
 *
 * @module components/ui/utils
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges CSS class names safely, handling Tailwind CSS conflicts.
 *
 * Combines clsx for conditional classes with tailwind-merge to
 * properly handle conflicting Tailwind utility classes.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```ts
 * // Simple merge
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 wins)
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active', hasError && 'error')
 *
 * // With arrays/objects
 * cn(['a', 'b'], { c: true, d: false })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
