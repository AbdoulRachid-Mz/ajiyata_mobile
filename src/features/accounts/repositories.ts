
import { db } from '@/db';
import { accounts } from '@/db/schema';
import type { NewAccount, Account } from '@/types';
import { eq } from 'drizzle-orm';

export const accountRepository = {
  async create(newAccount: NewAccount): Promise<Account> {
    const [created] = await db.insert(accounts).values(newAccount as any).returning();
    return created as Account;
  },

  async getAllForUser(userId: string): Promise<Account[]> {
    return (await db.select().from(accounts).where(eq(accounts.userId, userId))) as Account[];
  },

  async getById(accountId: string): Promise<Account | null> {
    const [account] = (await db.select().from(accounts).where(eq(accounts.id, accountId))) as Account[];
    return account || null;
  },

  async update(accountId: string, updates: Partial<Account>): Promise<Account | null> {
    const [updated] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(accounts.id, accountId))
      .returning();
    return updated as Account | null;
  },
};
