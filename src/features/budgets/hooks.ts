import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { budgetRepository } from "./repositories";
import type { NewBudget, Budget, BudgetWithRelations, MiniAccount, MiniCategory } from "@/types";
import { useTransactions } from "../transactions/hooks";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { budgets as budgetsTable } from "@/db/schema";

export const useBudgets = (accountId: string) => {
  return useQuery({
    queryKey: ["budgets", accountId],
    queryFn: () => budgetRepository.getAllForAccount(accountId),
    enabled: !!accountId,
  });
};

// Hook pour les budgets avec calcul par période
export const useBudgetsWithPeriod = (accountId: string) => {
  const { data: budgets, isLoading, refetch } = useBudgets(accountId);
  const { data: transactions } = useTransactions(accountId);

  const budgetsWithPeriod = useMemo(() => {
    if (!budgets || !transactions) return [];

    const now = new Date();

    return budgets.map((budget) => {
      // 1. Déterminer la période du budget
      let start: Date;
      let end: Date;

      switch (budget.period) {
        case "daily":
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case "weekly":
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "monthly":
        default:
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
      }

      // 2. Vérifier si le budget est expiré
      const isExpired = end < now;

      // 3. Calculer les dépenses pour la période
      let spent = 0;
      for (const tx of transactions) {
        if (tx.categoryId === budget.categoryId && tx.type === "expense") {
          const txDate = new Date(tx.date);
          if (isWithinInterval(txDate, { start, end })) {
            spent += Number(tx.amount);
          }
        }
      }

      // 4. Déterminer le statut
      let status = budget.status;
      if (isExpired && status === "active") {
        status = "completed";
      } else if (status === "active" && spent > budget.limit) {
        status = "exceeded";
      }

      return {
        ...budget,
        spent,
        status,
        periodStart: start,
        periodEnd: end,
        isExpired,
        accountId: budget.accountId || accountId,
      };
    });
  }, [budgets, transactions]);

  return {
    data: budgetsWithPeriod,
    isLoading,
    refetch,
  };
};

export const useExpiredBudgets = (accountId: string) => {
  const queryClient = useQueryClient();
  const { data: budgets, refetch } = useBudgets(accountId);

  useEffect(() => {
    if (!budgets) return;

    const checkExpired = async () => {
      const now = new Date();
      const expiredBudgets = budgets.filter((b) => {
        if (b.status !== "active") return false;
        const endDate = new Date(b.endDate);
        return endDate < now;
      });

      if (expiredBudgets.length > 0) {
        for (const budget of expiredBudgets) {
          await db
            .update(budgetsTable)
            .set({
              status: "completed",
              updatedAt: new Date(),
              syncStatus: "pending",
            })
            .where(eq(budgetsTable.id, budget.id));
        }

        // Invalider le cache
        queryClient.invalidateQueries({ queryKey: ["budgets", accountId] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });

        console.log(`✅ ${expiredBudgets.length} budgets expirés mis à jour`);
      }
    };

    // Vérifier immédiatement
    checkExpired();

    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkExpired, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [budgets, accountId, queryClient]);
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBudget: NewBudget) => budgetRepository.create(newBudget),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", variables.accountId],
      });
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
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useDeleteBudget = (accountId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", accountId] });
    },
  });
};
