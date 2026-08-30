import { useMutation } from '@tanstack/react-query';
import { staffImportApi } from '../api/staffImportApi';

export function useUploadStaffImport() {
  return useMutation({
    mutationFn: (file: File) => staffImportApi.upload(file),
  });
}
