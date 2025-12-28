/**
 * @fileoverview Chat Textarea component with AI-themed gradient styling.
 *
 * Provides a styled textarea field for the chat input with
 * gradient background and border to indicate AI interaction.
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
 * Styled textarea component for AI chat input.
 *
 * Features:
 * - Gradient background (blue/purple AI theme)
 * - Gradient border effect
 * - High contrast placeholder text
 * - Cyan focus ring
 * - Auto-resize support (via external ref)
 * - Mobile-responsive text sizing
 *
 * @param props - Textarea props including isMobile flag
 * @returns Rendered textarea element with gradient wrapper
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ isMobile = false, ...props }, ref) => {
    return (
      <div
        className="flex-1"
        style={{
          padding: '2px',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
        }}
      >
        <textarea
          ref={ref}
          data-slot="textarea"
          className={`w-full min-h-0 text-white focus:outline-none resize-none px-4 scrollbar-hide ${isMobile ? 'text-lg py-3' : 'text-sm py-2'}`}
          style={{
            display: 'block',
            margin: 0,
            border: 'none',
            maxHeight: '120px',
            lineHeight: '1.5',
            borderRadius: 'calc(1rem - 2px)',
            background: 'linear-gradient(135deg, #282469 0%, #2f2d74 50%, #0b69e4 100%)',
          }}
          {...props}
        />
        <style>{`
          [data-slot="textarea"]::placeholder {
            color: #c7d2fe;
            opacity: 1;
          }
        `}</style>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
