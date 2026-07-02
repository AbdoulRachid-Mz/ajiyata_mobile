
import { db } from '@/db';
import { transactions } from '@/db/schema';
import type { NewTransaction, Transaction } from '@/types';
import { eq, desc } from 'drizzle-orm';

export const transactionRepository = {
  async create(newTransaction: NewTransaction): Promise<Transaction> {
    const results = await db.insert(transactions).values(newTransaction as any).returning();
    return results[0] as Transaction;
  },
  
  async update(updatedTransaction: Partial<Transaction> & { id: string }): Promise<Transaction> {
    const { id, ...data } = updatedTransaction;
    const [updated] = await db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return updated as Transaction;
  },

  async getAllForAccount(accountId: string): Promise<Transaction[]> {
    return (await db.select().from(transactions).where(eq(transactions.accountId, accountId)).orderBy(desc(transactions.date))) as Transaction[];
  },

  async getRecentForAccount(accountId: string, limit: number = 5): Promise<Transaction[]> {
    return (await db.select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date))
      .limit(limit)) as Transaction[];
  },

  async getById(transactionId: string): Promise<Transaction | null> {
    const [transaction] = (await db.select().from(transactions).where(eq(transactions.id, transactionId))) as Transaction[];
    return transaction || null;
  },

  async delete(transactionId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, transactionId));
  },
};
