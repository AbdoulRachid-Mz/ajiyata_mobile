import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { transactionRepository } from './repositories';
import type { GetAllTransactionsOptions, GetByIdOptions, NewTransaction, Transaction } from '@/types';

export const useTransactions = (accountId: string, options?: GetAllTransactionsOptions) => {
  return useQuery({
    queryKey: ["transactions", accountId, options],
    queryFn: () => transactionRepository.getPaginatedForAccount(accountId, options),
    enabled: !!accountId,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useTransactionDetails = (transactionId: string, options?: GetByIdOptions) => {
  return useQuery({
    queryKey: ['transactions', 'detail', transactionId, options],
    queryFn: () => transactionRepository.getById(transactionId, options),
    enabled: !!transactionId,
    staleTime: 60 * 1000,
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
      queryClient.invalidateQueries({
        queryKey: ['transactions', variables.accountId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', 'recent', variables.accountId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', 'detail', variables.id],
      });
    },
  });
};
