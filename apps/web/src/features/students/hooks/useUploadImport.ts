import { useMutation } from '@tanstack/react-query';
import { importApi } from '../api/importApi';

export function useUploadImport() {
  return useMutation({
    mutationFn: (file: File) => importApi.upload(file),
  });
}
