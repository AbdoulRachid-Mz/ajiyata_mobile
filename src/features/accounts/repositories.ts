import { db } from '@/db';
import { accounts } from '@/db/schema';
import type { Account, AccountQueryResult, AccountStats, GetAllAccountsOptions, NewAccount } from '@/types';
import { and, eq } from 'drizzle-orm';

export const accountRepository = {
  async create(newAccount: NewAccount): Promise<Account> {
    const [created] = await db.insert(accounts).values(newAccount).returning();
    return created as Account;
  },

  async getAllForUser(userId: string, options?: GetAllAccountsOptions): Promise<Account[]> {
    const res = await this.getPaginatedForUser(userId, options);
    return res.data;
  },

  async getPaginatedForUser(userId: string, options?: GetAllAccountsOptions): Promise<AccountQueryResult> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);

    const conditions = [eq(accounts.userId, userId)];

    if (options?.type) {
      conditions.push(eq(accounts.type, options.type as typeof accounts.type._.data));
    }

    const all = (await db
      .select()
      .from(accounts)
      .where(and(...conditions))) as Account[];

    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = all.slice(startIndex, startIndex + limit);

    let stats: AccountStats | undefined;
    if (options?.includeStats !== false) {
      const totalBalance = all.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
      stats = {
        totalBalance,
        activeAccountsCount: total,
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

  async getById(accountId: string): Promise<Account | null> {
    const [account] = (await db.select().from(accounts).where(eq(accounts.id, accountId))) as Account[];
    return account || null;
  },

  async update(accountId: string, updates: Partial<Account>): Promise<Account | null> {
    const [updated] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, accountId))
      .returning();
    return updated as Account | null;
  },
};
