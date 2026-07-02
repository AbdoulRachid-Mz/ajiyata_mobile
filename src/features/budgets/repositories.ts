import { db } from '@/db';
import { budgets } from '@/db/schema';
import type { NewBudget, Budget } from '@/types';
import { eq } from 'drizzle-orm';

export const budgetRepository = {
  async create(newBudget: NewBudget): Promise<Budget> {
    const results = await db.insert(budgets).values(newBudget as any).returning();
    return results[0] as Budget;
  },

  async getAllForAccount(accountId: string): Promise<Budget[]> {
    return (await db.select().from(budgets).where(eq(budgets.accountId, accountId))) as Budget[];
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
