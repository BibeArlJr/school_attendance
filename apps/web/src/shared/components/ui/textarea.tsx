import * as React from 'react';
import { cn } from '@/shared/lib/utils';

// Same border/radius/focus-ring language as Input (see its own docblock)
// — just without the fixed h-8 height, since a textarea's height comes
// from its `rows` prop instead.
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 focus-visible:ring-3 aria-invalid:ring-3 w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
