
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from './repositories';
import type { User } from '@/types';
import { useAppStore } from '@/stores/app-store';

export const useUser = (userId?: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getById(userId!),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { setCurrentUser } = useAppStore();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<User>;
    }) => {
      return userRepository.update(userId, updates);
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
        setCurrentUser(updatedUser);
      }
    },
  });
};

