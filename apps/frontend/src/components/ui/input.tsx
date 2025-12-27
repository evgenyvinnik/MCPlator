/**
 * @fileoverview Reusable Input component with consistent styling.
 *
 * Provides a styled input field with focus ring, placeholder,
 * disabled states, and file input support.
 *
 * @module components/ui/input
 */

import * as React from 'react';

import { cn } from './utils';

/**
 * Styled input component with dark theme support.
 *
 * Features:
 * - Focus ring with primary color
 * - Placeholder text styling
 * - Disabled state styling
 * - File input support
 * - ARIA invalid state styling
 * - Responsive text sizing (md:text-sm)
 *
 * @param props - Standard input props plus className
 * @returns Rendered input element
 *
 * @example
 * ```tsx
 * // Text input
 * <Input type="text" placeholder="Enter name" />
 *
 * // Email with validation
 * <Input type="email" aria-invalid={!isValid} />
 *
 * // File input
 * <Input type="file" accept="image/*" />
 * ```
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
