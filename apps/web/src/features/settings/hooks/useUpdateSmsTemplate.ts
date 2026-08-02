import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settingsApi';
import type { SmsTemplateType } from '../types';

export function useUpdateSmsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, templateText }: { type: SmsTemplateType; templateText: string }) =>
      settingsApi.updateSmsTemplate(type, templateText),
    onSuccess: (_data, { templateText }) => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'sms-templates'] });
      // Blank templateText is a reset (see UpdateSmsTemplateRequest's
      // docblock), not a save — the toast should say what actually
      // happened, not always claim something was saved.
      toast.success(
        templateText.trim() === ''
          ? 'Reverted to the platform default template.'
          : 'Template saved successfully.',
      );
    },
  });
}

export function useUpdatePlatformSmsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, templateText }: { type: SmsTemplateType; templateText: string }) =>
      settingsApi.updatePlatformSmsTemplate(type, templateText),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', 'sms-templates'] });
      toast.success('Platform default template saved successfully.');
    },
  });
}
