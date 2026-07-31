import { db } from '@/db';
import { accounts, savingGoals } from '@/db/schema';
import type {
  GetAllGoalsOptions,
  GetByIdOptions,
  GoalDetailResult,
  GoalQueryResult,
  GoalStats,
  MiniAccount,
  NewSavingGoal,
  SavingGoal,
  SavingGoalWithRelations,
} from '@/types';
import { and, eq } from 'drizzle-orm';

export const savingGoalRepository = {
  async create(newGoal: NewSavingGoal): Promise<SavingGoal> {
    const results = await db.insert(savingGoals).values(newGoal).returning();
    return results[0] as SavingGoal;
  },

  async getAllForAccount(
    accountId: string,
    options?: GetAllGoalsOptions
  ): Promise<SavingGoalWithRelations[]> {
    const result = await this.getPaginatedForAccount(accountId, options);
    return result.data;
  },

  async getPaginatedForAccount(
    accountId: string,
    options?: GetAllGoalsOptions
  ): Promise<GoalQueryResult> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);

    const conditions = [eq(savingGoals.accountId, accountId)];

    if (options?.status) {
      conditions.push(eq(savingGoals.status, options.status as typeof savingGoals.status._.data));
    }

    const rows = await db
      .select({
        goal: savingGoals,
        account: accounts,
      })
      .from(savingGoals)
      .leftJoin(accounts, eq(savingGoals.accountId, accounts.id))
      .where(and(...conditions));

    let mapped: SavingGoalWithRelations[] = rows.map((row) => ({
      ...row.goal,
      account: row.account
        ? ({
            id: row.account.id,
            userId: row.account.userId,
            name: row.account.name,
            type: row.account.type,
            currency: row.account.currency,
          } as MiniAccount)
        : ({} as MiniAccount),
    } as SavingGoalWithRelations));

    if (options?.search && options.search.trim() !== '') {
      const s = options.search.trim().toLowerCase();
      mapped = mapped.filter((g) => g.title?.toLowerCase().includes(s));
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = mapped.slice(startIndex, startIndex + limit);

    let stats: GoalStats | undefined;
    if (options?.includeStats !== false) {
      let totalTarget = 0;
      let totalCurrent = 0;
      let completedCount = 0;

      mapped.forEach((g) => {
        const tgt = Number(g.targetAmount) || 0;
        const cur = Number(g.currentAmount) || 0;
        totalTarget += tgt;
        totalCurrent += cur;
        if (g.status === 'completed' || cur >= tgt) {
          completedCount++;
        }
      });

      const progressPercentage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

      stats = {
        totalTarget,
        totalCurrent,
        progressPercentage,
        completedCount,
      };
    }

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      stats,
    };
  },

  async update(goalId: string, data: Partial<SavingGoal>): Promise<SavingGoal> {
    const results = await db.update(savingGoals).set(data).where(eq(savingGoals.id, goalId)).returning();
    return results[0] as SavingGoal;
  },

  async getById(
    goalId: string,
    options?: GetByIdOptions
  ): Promise<GoalDetailResult | null> {
    const rows = await db
      .select({
        goal: savingGoals,
        account: accounts,
      })
      .from(savingGoals)
      .leftJoin(accounts, eq(savingGoals.accountId, accounts.id))
      .where(eq(savingGoals.id, goalId))
      .limit(1);

    if (!rows || rows.length === 0) return null;

    const mainGoal: SavingGoalWithRelations = {
      ...rows[0].goal,
      account: rows[0].account
        ? ({
            id: rows[0].account.id,
            userId: rows[0].account.userId,
            name: rows[0].account.name,
            type: rows[0].account.type,
            currency: rows[0].account.currency,
          } as MiniAccount)
        : ({} as MiniAccount),
    } as SavingGoalWithRelations;

    const similarLimit = options?.similarLimit ?? 5;
    let similarGoals: SavingGoalWithRelations[] = [];

    if (similarLimit > 0 && mainGoal.accountId) {
      const similarResult = await this.getPaginatedForAccount(mainGoal.accountId, { limit: similarLimit + 1 });
      similarGoals = similarResult.data.filter((g) => g.id !== mainGoal.id).slice(0, similarLimit);
    }

    return {
      goal: mainGoal,
      similarGoals,
    };
  },

  async delete(goalId: string): Promise<void> {
    await db.delete(savingGoals).where(eq(savingGoals.id, goalId));
  },
};
