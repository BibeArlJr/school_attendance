<?php

namespace App\Modules\BulkSms\Services;

use App\Modules\BulkSms\Models\BulkSmsContact;
use App\Support\Services\AuditLogger;
use Illuminate\Validation\ValidationException;

/**
 * Manual add/edit/delete path — always goes through the same
 * BulkSmsPhoneNormalizer the upload preview/confirm path uses, so
 * "valid" and "duplicate" mean identically the same thing regardless of
 * how a contact entered the system.
 */
class BulkSmsContactService
{
    public function __construct(
        private readonly BulkSmsPhoneNormalizer $normalizer,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId): BulkSmsContact
    {
        $normalized = $this->normalizeOrFail($data['phone'] ?? '');
        $this->guardAgainstDuplicate($normalized);

        $contact = BulkSmsContact::create([
            'name' => $data['name'] ?? null,
            'phone' => $normalized,
            'created_by' => $userId,
        ]);

        $this->auditLogger->log('bulk_sms_contact.created', 'bulk_sms_contact', $contact->id, null, [
            'name' => $contact->name,
            'phone' => $contact->phone,
        ]);

        return $contact;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(BulkSmsContact $contact, array $data): BulkSmsContact
    {
        $normalized = $this->normalizeOrFail($data['phone'] ?? '');
        $this->guardAgainstDuplicate($normalized, excludeId: $contact->id);

        $before = ['name' => $contact->name, 'phone' => $contact->phone];

        $contact->update([
            'name' => $data['name'] ?? null,
            'phone' => $normalized,
        ]);

        $this->auditLogger->log('bulk_sms_contact.updated', 'bulk_sms_contact', $contact->id, $before, [
            'name' => $contact->name,
            'phone' => $contact->phone,
        ]);

        return $contact;
    }

    public function destroy(BulkSmsContact $contact): void
    {
        $this->auditLogger->log('bulk_sms_contact.deleted', 'bulk_sms_contact', $contact->id, [
            'name' => $contact->name,
            'phone' => $contact->phone,
        ], null);

        $contact->delete();
    }

    private function normalizeOrFail(string $rawPhone): string
    {
        $result = $this->normalizer->normalize($rawPhone);

        if (! $result['valid']) {
            throw ValidationException::withMessages(['phone' => [$result['reason']]]);
        }

        return $result['normalized'];
    }

    private function guardAgainstDuplicate(string $normalizedPhone, ?int $excludeId = null): void
    {
        $exists = BulkSmsContact::query()
            ->where('phone', $normalizedPhone)
            ->when($excludeId !== null, fn ($query) => $query->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'phone' => ['A contact with this phone number already exists.'],
            ]);
        }
    }
}
