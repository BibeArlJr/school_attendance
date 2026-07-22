import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full last:w-2/3" />
      ))}
    </div>
  );
}
