
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionRepository } from './repositories';
import type { NewTransaction, Transaction } from '@/types';

export const useTransactions = (accountId: string) => {
  return useQuery({
    queryKey: ['transactions', accountId],
    queryFn: () => transactionRepository.getAllForAccount(accountId),
    enabled: !!accountId,
  });
};

export const useRecentTransactions = (accountId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['transactions', 'recent', accountId, limit],
    queryFn: () => transactionRepository.getRecentForAccount(accountId, limit),
    enabled: !!accountId,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTransaction: NewTransaction) => {
      return await transactionRepository.create(newTransaction);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.accountId],
      });
    },
  });
};

export const useDeleteTransaction = (accountId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: string) => {
      return await transactionRepository.delete(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', accountId],
      });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedTransaction: Partial<Transaction> & { id: string }) => {
      return await transactionRepository.update(updatedTransaction);
    },
    onSuccess: (_, variables) => {
      // Invalider les queries concernées
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.accountId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', 'recent', variables.accountId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.id],
      });
    },
  });
};
