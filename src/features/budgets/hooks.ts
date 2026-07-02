import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetRepository } from './repositories';
import type { NewBudget } from '@/types';

export const useBudgets = (accountId: string) => {
  return useQuery({
    queryKey: ['budgets', accountId],
    queryFn: () => budgetRepository.getAllForAccount(accountId),
    enabled: !!accountId,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBudget: NewBudget) => budgetRepository.create(newBudget),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.accountId] });
    },
  });
};
