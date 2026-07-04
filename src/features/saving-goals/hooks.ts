import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingGoalRepository } from './repositories';
import type { NewSavingGoal, SavingGoal } from '@/types';

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

export const useUpdateSavingGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<SavingGoal> }) =>
      savingGoalRepository.update(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals'] });
    },
  });
};

export const useDeleteSavingGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => savingGoalRepository.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals'] });
    },
  });
};
