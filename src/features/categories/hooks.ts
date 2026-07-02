
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryRepository } from './repositories';
import type { NewCategory, Category } from '@/types';

export const useCategories = (accountId: string) => {
  return useQuery({
    queryKey: ['categories', accountId],
    queryFn: () => categoryRepository.getAllForAccount(accountId),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory: NewCategory) => {
      return await categoryRepository.create(newCategory);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['categories', variables.accountId],
      });
    },
  });
};
