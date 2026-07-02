import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingGoalRepository } from './repositories';
import type { NewSavingGoal } from '@/types';

export const useSavingGoals = (accountId: string) => {
  return useQuery({
    queryKey: ['saving-goals', accountId],
    queryFn: () => savingGoalRepository.getAllForAccount(accountId),
    enabled: !!accountId,
  });
};

export const useCreateSavingGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: NewSavingGoal) => savingGoalRepository.create(newGoal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', variables.accountId] });
    },
  });
};
