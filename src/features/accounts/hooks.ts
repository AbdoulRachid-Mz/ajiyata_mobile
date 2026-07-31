import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountRepository } from './repositories';
import type { GetAllAccountsOptions, NewAccount, Account } from '@/types';
import { useAppStore } from '@/stores/app-store';

export const useAccounts = (userId: string, options?: GetAllAccountsOptions) => {
  return useQuery({
    queryKey: ['accounts', userId, options],
    queryFn: () => accountRepository.getPaginatedForUser(userId, options),
    enabled: !!userId,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAccount: NewAccount) => {
      return await accountRepository.create(newAccount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', variables.userId],
      });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const { setCurrentAccount } = useAppStore();

  return useMutation({
    mutationFn: async ({
      accountId,
      updates,
    }: {
      accountId: string;
      updates: Partial<Account>;
    }) => {
      return accountRepository.update(accountId, updates);
    },
    onSuccess: (updatedAccount) => {
      if (updatedAccount) {
        queryClient.invalidateQueries({
          queryKey: ['accounts', updatedAccount.userId],
        });
        setCurrentAccount(updatedAccount);
      }
    },
  });
};
