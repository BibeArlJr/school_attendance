import { Link } from 'react-router-dom';
import { useStudentIdCard } from '../hooks/useStudentIdCard';
import { BarcodeImage } from './BarcodeImage';
import { studentIdCardPath } from '@/app/router/routes';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/shared/components/feedback/LoadingSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface IdCardSectionProps {
  studentId: number;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lost: 'outline',
  deactivated: 'secondary',
};

export function IdCardSection({ studentId }: IdCardSectionProps) {
  const cardQuery = useStudentIdCard(studentId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ID Card</CardTitle>
        <Button size="sm" variant="outline" asChild>
          <Link to={studentIdCardPath(studentId)}>View full card</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {cardQuery.isLoading ? (
          <LoadingSkeleton lines={2} />
        ) : !cardQuery.data ? (
          <EmptyState title="No ID card found" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-white p-1">
              <BarcodeImage value={cardQuery.data.barcode_value} className="h-10" />
            </div>
            <Badge variant={STATUS_VARIANT[cardQuery.data.status]} className="capitalize">
              {cardQuery.data.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
