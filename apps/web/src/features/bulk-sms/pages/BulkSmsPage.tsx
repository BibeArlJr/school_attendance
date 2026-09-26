import { useState } from 'react';
import { BulkSmsContactsSection } from '../components/BulkSmsContactsSection';
import { BulkSmsMessageComposer } from '../components/BulkSmsMessageComposer';
import { BulkSmsUploadHistorySection } from '../components/BulkSmsUploadHistorySection';
import { useBulkSmsContacts } from '../hooks/useBulkSmsContacts';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/button';

type Tab = 'contacts' | 'compose';

const TABS: { key: Tab; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'compose', label: 'Compose Message' },
];

/**
 * Platform-level utility (super_admin/platform-admin only) — one page,
 * two tabs, same plain-Button tab pattern as SettingsPage.tsx (no
 * dedicated Tabs component exists in this codebase). Kept as one route
 * rather than two separate ones (unlike Platform Console's Schools vs
 * Audit Log split) because the composer's own recipient-count/estimated-
 * segments figures are naturally shared page state with the Contacts
 * tab, not two genuinely independent tools.
 */
export default function BulkSmsPage() {
  const [tab, setTab] = useState<Tab>('contacts');

  // Cheap count-only query (per_page: 1) — the Composer tab only ever
  // needs the total, never the rows themselves.
  const contactsCountQuery = useBulkSmsContacts({ page: 1, per_page: 1 });

  return (
    <PageContainer
      title="Bulk SMS"
      description="Generic bulk-messaging contacts and message composer. Independent of student/guardian/staff data — real sending is not enabled at this stage."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'contacts' && (
        <div className="space-y-4">
          <BulkSmsContactsSection />
          <BulkSmsUploadHistorySection />
        </div>
      )}

      {tab === 'compose' && (
        <BulkSmsMessageComposer
          recipientCount={contactsCountQuery.data?.total ?? 0}
          isLoadingRecipientCount={contactsCountQuery.isLoading}
        />
      )}
    </PageContainer>
  );
}
