import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface PageContainerProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, description, children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6', className)}>
      {(title || description) && (
        <div>
          {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
