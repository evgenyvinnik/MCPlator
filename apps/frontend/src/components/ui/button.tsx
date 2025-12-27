/**
 * @fileoverview Reusable Button component with variant support.
 *
 * Built with class-variance-authority for type-safe variants
 * and Radix UI Slot for composition.
 *
 * @module components/ui/button
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

/**
 * Button style variants using class-variance-authority.
 *
 * Variants:
 * - `default`: Primary button with solid background
 * - `destructive`: Red button for dangerous actions
 * - `outline`: Bordered button with transparent background
 * - `secondary`: Muted secondary action button
 * - `ghost`: Minimal hover-only button
 * - `link`: Underlined text link style
 *
 * Sizes:
 * - `default`: Standard height (h-9)
 * - `sm`: Small button (h-8)
 * - `lg`: Large button (h-10)
 * - `icon`: Square icon-only button (size-9)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Polymorphic button component with variant styling.
 *
 * Supports composition via the `asChild` prop which renders
 * children directly using Radix UI Slot.
 *
 * @param props - Button props including variant and size
 * @returns Rendered button element
 *
 * @example
 * ```tsx
 * // Default button
 * <Button>Click me</Button>
 *
 * // Destructive button with icon
 * <Button variant="destructive" size="sm">
 *   <TrashIcon /> Delete
 * </Button>
 *
 * // As link (composition)
 * <Button asChild variant="link">
 *   <a href="/about">About</a>
 * </Button>
 * ```
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render as child element (Radix Slot) */
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
