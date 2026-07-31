import { db } from '@/db';
import { accounts, budgets, categories } from '@/db/schema';
import type {
  Budget,
  BudgetQueryResult,
  BudgetStats,
  BudgetWithRelations,
  GetAllBudgetsOptions,
  MiniAccount,
  MiniCategory,
  NewBudget,
} from '@/types';
import { and, eq, like } from 'drizzle-orm';

export const budgetRepository = {
  async create(newBudget: NewBudget): Promise<Budget> {
    const results = await db.insert(budgets).values(newBudget).returning();
    return results[0] as Budget;
  },

  async getAllForAccount(
    accountId: string,
    options?: GetAllBudgetsOptions
  ): Promise<BudgetWithRelations[]> {
    const result = await this.getPaginatedForAccount(accountId, options);
    return result.data;
  },

  async getPaginatedForAccount(
    accountId: string,
    options?: GetAllBudgetsOptions
  ): Promise<BudgetQueryResult> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);

    const conditions = [eq(budgets.accountId, accountId)];

    if (options?.period) {
      conditions.push(eq(budgets.period, options.period as any));
    }
    if (options?.status) {
      conditions.push(eq(budgets.status, options.status as any));
    }

    const rows = await db
      .select({
        budgets: budgets,
        account: accounts,
        category: categories,
      })
      .from(budgets)
      .innerJoin(accounts, eq(budgets.accountId, accounts.id))
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(...conditions));

    let mapped: BudgetWithRelations[] = rows.map((row) => ({
      ...row.budgets,
      account: {
        id: row.account.id,
        userId: row.account.userId,
        name: row.account.name,
        type: row.account.type,
        currency: row.account.currency,
      } as MiniAccount,
      category: row.category
        ? ({
            id: row.category.id,
            accountId: row.category.accountId,
            name: row.category.name,
            type: row.category.type,
            color: row.category.color,
            icon: row.category.icon,
          } as MiniCategory)
        : undefined,
    } as BudgetWithRelations));

    if (options?.search && options.search.trim() !== '') {
      const s = options.search.trim().toLowerCase();
      mapped = mapped.filter(b => b.category?.name?.toLowerCase().includes(s));
    }

    const total = mapped.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = mapped.slice(startIndex, startIndex + limit);

    let stats: BudgetStats | undefined;
    if (options?.includeStats !== false) {
      let totalLimit = 0;
      let totalSpent = 0;
      let exceededCount = 0;

      mapped.forEach((b) => {
        const lim = Number(b.limit) || 0;
        const sp = Number(b.spent) || 0;
        totalLimit += lim;
        totalSpent += sp;
        if (sp > lim) exceededCount++;
      });

      stats = {
        totalLimit,
        totalSpent,
        remaining: Math.max(0, totalLimit - totalSpent),
        exceededCount,
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
