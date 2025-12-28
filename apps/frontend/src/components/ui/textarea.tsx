/**
 * @fileoverview Chat Textarea component with consistent styling.
 *
 * Provides a styled textarea field for the chat input with
 * auto-resize support and mobile-responsive sizing.
 *
 * @module components/ui/textarea
 */

import * as React from 'react';

/**
 * Props for the Textarea component.
 */
interface TextareaProps
  extends Omit<React.ComponentProps<'textarea'>, 'className' | 'style'> {
  /** Whether to use mobile-sized styling */
  isMobile?: boolean;
}

/**
 * Styled textarea component for chat input.
 *
 * Features:
 * - Glassmorphism styling with backdrop blur
 * - Cyan focus ring
 * - Auto-resize support (via external ref)
 * - Mobile-responsive text sizing
 * - Rounded corners (1rem)
 * - Max height of 120px
 *
 * @param props - Textarea props including isMobile flag
 * @returns Rendered textarea element
 *
 * @example
 * ```tsx
 * <Textarea
 *   ref={textareaRef}
 *   value={inputText}
 *   onChange={(e) => setInputText(e.target.value)}
 *   placeholder="Type your message..."
 *   isMobile={false}
 * />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ isMobile = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={`flex-1 min-h-0 bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-cyan-400 focus:border-transparent focus:outline-none resize-none px-4 scrollbar-hide ${isMobile ? 'text-lg py-3' : 'text-sm py-2'}`}
        style={{ maxHeight: '120px', lineHeight: '1.5', borderRadius: '1.5 rem' }}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
