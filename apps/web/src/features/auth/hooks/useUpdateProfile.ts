import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export function useUpdateProfile() {
  const updateOwnName = useAuthStore((state) => state.updateOwnName);

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      updateOwnName(user.name);
      toast.success('Profile updated successfully.');
    },
  });
}
