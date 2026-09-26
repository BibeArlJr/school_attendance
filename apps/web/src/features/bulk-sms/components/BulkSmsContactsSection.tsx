import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBulkSmsContacts } from '../hooks/useBulkSmsContacts';
import { useDeleteBulkSmsContact } from '../hooks/useDeleteBulkSmsContact';
import type { BulkSmsContact } from '../types';
import { buildBulkSmsContactColumns } from './bulkSmsContactColumns';
import { BulkSmsContactFormDialog } from './BulkSmsContactFormDialog';
import { BulkSmsUploadButton } from './BulkSmsUploadButton';
import { DataTable } from '@/shared/components/data-table/DataTable';
import { DeleteConfirmDialog } from '@/shared/components/DeleteConfirmDialog';
import { Button } from '@/shared/components/ui/button';
import { extractErrorMessage } from '@/shared/lib/errors';

const PER_PAGE = 10;

export function BulkSmsContactsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [editingContact, setEditingContact] = useState<BulkSmsContact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<BulkSmsContact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteContact = useDeleteBulkSmsContact();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const contactsQuery = useBulkSmsContacts({
    page: pageIndex + 1,
    per_page: PER_PAGE,
    search: debouncedSearch || undefined,
  });

  const columns = useMemo(
    () =>
      buildBulkSmsContactColumns({
        onEdit: (contact) => {
          setEditingContact(contact);
          setFormOpen(true);
        },
        onDeleteRequest: (contact) => {
          setDeletingContact(contact);
          setDeleteDialogOpen(true);
        },
      }),
    [],
  );

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteDialogOpen(nextOpen);
    if (!nextOpen) {
      deleteContact.reset();
    }
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={contactsQuery.data?.data ?? []}
        isLoading={contactsQuery.isLoading}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Search by name or phone"
        pageIndex={pageIndex}
        pageCount={contactsQuery.data?.last_page ?? 1}
        onPageChange={setPageIndex}
        totalCount={contactsQuery.data?.total}
        emptyTitle="No contacts yet — add one manually or upload a file"
        actions={
          <>
            <BulkSmsUploadButton onImported={() => contactsQuery.refetch()} />
            <Button
              onClick={() => {
                setEditingContact(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Contact
            </Button>
          </>
        }
      />

      <BulkSmsContactFormDialog open={formOpen} onOpenChange={setFormOpen} contact={editingContact} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteOpenChange}
        entityLabel="contact"
        alternativeActionHint="This is a bulk-messaging contact only — it has no other record elsewhere."
        isPending={deleteContact.isPending}
        errorMessage={deleteContact.isError ? extractErrorMessage(deleteContact.error) : null}
        onConfirm={() => {
          if (!deletingContact) return;
          deleteContact.mutate(deletingContact.uuid, {
            onSuccess: () => setDeleteDialogOpen(false),
          });
        }}
      />
    </div>
  );
}
