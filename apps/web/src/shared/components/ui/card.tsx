import * as React from 'react';
import { cn } from '@/shared/lib/utils';

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // NOTE: this component's spacing is driven by a --card-spacing
        // custom property, referenced via Tailwind v4's `-(--var)` bare-
        // value-from-CSS-variable shorthand — but this project runs
        // Tailwind v3.4 (see package.json), where that syntax doesn't
        // exist and is silently ignored (no CSS generated, no error).
        // That left every Card in the app with 0px padding/gap wherever
        // this shorthand was used (Prompt 22 addendum). Fixed by using
        // v3's bracket arbitrary-value syntax instead: `-[var(--x)]`, and
        // by giving --card-spacing a literal value instead of Tailwind
        // v4's `--spacing()` theme function (also v4-only).
        'group/card gap-[var(--card-spacing)] py-[var(--card-spacing)] has-[[data-slot=card-footer]]:pb-0 data-[size=sm]:has-[[data-slot=card-footer]]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl flex flex-col overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:1rem] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:0.75rem]',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header px-[var(--card-spacing)] has-[[data-slot=card-action]]:grid-cols-[1fr_auto] has-[[data-slot=card-description]]:grid-rows-[auto_auto] [.border-b]:pb-[var(--card-spacing)] grid auto-rows-min items-start gap-1 rounded-t-xl',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'font-heading text-base font-medium leading-snug group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-content" className={cn('px-[var(--card-spacing)]', className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'p-[var(--card-spacing)] flex items-center rounded-b-xl border-t bg-muted/50',
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
