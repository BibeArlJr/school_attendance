import { ShieldX } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ForbiddenState({
  title = "You don't have access to this page",
  description = 'Your role does not have permission to view this module. Contact an administrator if you believe this is a mistake.',
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className,
      )}
      role="alert"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <ShieldX className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
