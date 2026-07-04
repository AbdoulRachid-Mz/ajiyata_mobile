import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetRepository } from './repositories';
import type { NewBudget, Budget } from '@/types';

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

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
      budgetRepository.update(id, data),
    onSuccess: (_, variables) => {
      // Invalider les requêtes (on suppose qu'on invalidate tout pour simplifier, ou on passe accountId si dispo)
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
};

export const useDeleteBudget = (accountId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', accountId] });
    },
  });
};
