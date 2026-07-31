import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingGoalRepository } from './repositories';
import type { GetAllGoalsOptions, GetByIdOptions, NewSavingGoal, SavingGoal } from '@/types';

export const useSavingGoals = (accountId: string, options?: GetAllGoalsOptions) => {
  return useQuery({
    queryKey: ['saving-goals', accountId, options],
    queryFn: () => savingGoalRepository.getPaginatedForAccount(accountId, options),
    enabled: !!accountId,
  });
};

export const useSavingGoalDetails = (goalId: string, options?: GetByIdOptions) => {
  return useQuery({
    queryKey: ['saving-goals', 'detail', goalId, options],
    queryFn: () => savingGoalRepository.getById(goalId, options),
    enabled: !!goalId,
  });
};

export const useCreateSavingGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: NewSavingGoal) => savingGoalRepository.create(newGoal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saving-goals', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['saving-goals'] });
    },
    onError: (error) => {
      console.error('Error creating saving goal:', error);
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
