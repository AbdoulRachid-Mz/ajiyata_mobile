
import { db } from '@/db';
import { accounts, attachments, categories, transactions } from '@/db/schema';
import type { MiniAccount, NewTransaction, Transaction, TransactionWithRelations } from '@/types';
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

  async getAllForAccount(accountId: string): Promise<TransactionWithRelations[]> {
    const results = await db
      .select({
        transaction: transactions,
        account: accounts,
        category: categories,
        attachments: attachments,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(attachments, eq(transactions.id, attachments.transactionId))
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date));

    const transactionMap = new Map<string, TransactionWithRelations>();
    
    results.forEach((row) => {
      const transactionId = row.transaction.id;
      
      if (!transactionMap.has(transactionId)) {
        transactionMap.set(transactionId, {
          ...row.transaction,
          account: row.account ? {
            id: row.account.id,
            userId: row.account.userId,
            name: row.account.name,
            type: row.account.type,
            currency: row.account.currency,
          } : undefined as unknown as MiniAccount,
          category: row.category ? {
            id: row.category.id,
            accountId: row.category.accountId,
            name: row.category.name,
            type: row.category.type,
            color: row.category.color,
            icon: row.category.icon,
          } : undefined,
          attachments: [],
        } as TransactionWithRelations);
      }
      
      if (row.attachments) {
        const transaction = transactionMap.get(transactionId)!;
        const existingAttachment = transaction.attachments.find(a => a.id === row.attachments!.id);
        if (!existingAttachment) {
          transaction.attachments.push({
            id: row.attachments.id,
            accountId: row.attachments.accountId,
            transactionId: row.attachments.transactionId,
            type: row.attachments.type,
            localUri: row.attachments.localUri,
          });
        }
      }
    });

    return Array.from(transactionMap.values());
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
