import { db } from '@/db';
import { accounts, budgets, categories } from '@/db/schema';
import type { NewBudget, Budget, BudgetWithRelations, MiniAccount, MiniCategory } from '@/types';
import { eq } from 'drizzle-orm';

export const budgetRepository = {
  async create(newBudget: NewBudget): Promise<Budget> {
    const results = await db.insert(budgets).values(newBudget).returning();
    return results[0] as Budget;
  },

  async getAllForAccount(accountId: string): Promise<BudgetWithRelations[]> {
    return await db
      .select({
        budgets: budgets,
        account: accounts,
        category: categories
      })
      .from(budgets)
      .innerJoin(accounts, eq(budgets.accountId, accounts.id))
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.accountId, accountId))
      .then(results => results.map(row => ({
        ...row.budgets,
        account: {
          id: row.account.id,
          userId: row.account.userId,
          name: row.account.name,
          type: row.account.type,
          currency: row.account.currency
        } as MiniAccount,
        category: row.category ? {
          id: row.category.id,
          accountId: row.category.accountId,
          name: row.category.name,
          type: row.category.type,
          color: row.category.color,
          icon: row.category.icon
        } as MiniCategory : undefined
      } as BudgetWithRelations)));
  },

  async update(budgetId: string, data: Partial<Budget>): Promise<Budget> {
    const results = await db
      .update(budgets)
      .set(data as any)
      .where(eq(budgets.id, budgetId))
      .returning();
    return results[0] as Budget;
  },

  async delete(budgetId: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, budgetId));
  },
};
