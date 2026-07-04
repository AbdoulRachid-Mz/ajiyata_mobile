import { db } from '@/db';
import { savingGoals } from '@/db/schema';
import type { NewSavingGoal, SavingGoal } from '@/types';
import { eq } from 'drizzle-orm';

export const savingGoalRepository = {
  async create(newGoal: NewSavingGoal): Promise<SavingGoal> {
    const results = await db.insert(savingGoals).values(newGoal as any).returning();
    return results[0] as SavingGoal;
  },

  async getAllForAccount(accountId: string): Promise<SavingGoal[]> {
    return (await db.select().from(savingGoals).where(eq(savingGoals.accountId, accountId))) as SavingGoal[];
  },

  async update(goalId: string, data: Partial<SavingGoal>): Promise<SavingGoal> {
    const results = await db.update(savingGoals).set(data as any).where(eq(savingGoals.id, goalId)).returning();
    return results[0] as SavingGoal;
  },

  async getById(goalId: string): Promise<SavingGoal | undefined> {
    const results = await db.select().from(savingGoals).where(eq(savingGoals.id, goalId)).limit(1);
    return results[0] as SavingGoal | undefined;
  },

  async delete(goalId: string): Promise<void> {
    await db.delete(savingGoals).where(eq(savingGoals.id, goalId));
  },
};
