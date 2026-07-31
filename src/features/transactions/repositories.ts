import { db } from '@/db';
import { accounts, attachments, categories, transactions } from '@/db/schema';
import type {
  GetAllTransactionsOptions,
  GetByIdOptions,
  MiniAccount,
  NewTransaction,
  Transaction,
  TransactionDetailResult,
  TransactionQueryResult,
  TransactionStats,
  TransactionWithRelations,
} from '@/types';
import { and, desc, eq, gte, lte, like, ne, sql } from 'drizzle-orm';

export const transactionRepository = {
  async create(newTransaction: NewTransaction): Promise<Transaction> {
    const results = await db.insert(transactions).values(newTransaction).returning();
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

  async getAllForAccount(
    accountId: string,
    options?: GetAllTransactionsOptions
  ): Promise<TransactionWithRelations[]> {
    const result = await this.getPaginatedForAccount(accountId, options);
    return result.data;
  },

  async getPaginatedForAccount(
    accountId: string,
    options?: GetAllTransactionsOptions
  ): Promise<TransactionQueryResult> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);

    const conditions = [eq(transactions.accountId, accountId)];

    if (options?.type) {
      conditions.push(eq(transactions.type, options.type));
    }
    if (options?.categoryId) {
      conditions.push(eq(transactions.categoryId, options.categoryId));
    }
    if (options?.search && options.search.trim() !== '') {
      conditions.push(like(transactions.title, `%${options.search.trim()}%`));
    }
    if (options?.startDate) {
      conditions.push(gte(transactions.date, new Date(options.startDate)));
    }
    if (options?.endDate) {
      conditions.push(lte(transactions.date, new Date(options.endDate)));
    }

    const whereClause = and(...conditions);

    // Fetch all raw joined rows for account with conditions
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
      .where(whereClause)
      .orderBy(desc(transactions.date));

    // Map rows into unique TransactionWithRelations
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

    const allTx = Array.from(transactionMap.values());
    const total = allTx.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = allTx.slice(startIndex, startIndex + limit);

    // Compute stats if requested or by default
    let stats: TransactionStats | undefined;
    if (options?.includeStats !== false) {
      let totalIncome = 0;
      let totalExpense = 0;

      allTx.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
          totalIncome += amt;
        } else if (tx.type === 'expense') {
          totalExpense += amt;
        }
      });

      stats = {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        totalCount: total,
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

  async getRecentForAccount(accountId: string, limit: number = 5): Promise<Transaction[]> {
    return (await db.select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date))
      .limit(limit)) as Transaction[];
  },

  async getById(
    transactionId: string,
    options?: GetByIdOptions
  ): Promise<TransactionDetailResult | null> {
    const all = await db
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
      .where(eq(transactions.id, transactionId));

    if (!all || all.length === 0) return null;

    const mainTx: TransactionWithRelations = {
      ...all[0].transaction,
      account: all[0].account ? {
        id: all[0].account.id,
        userId: all[0].account.userId,
        name: all[0].account.name,
        type: all[0].account.type,
        currency: all[0].account.currency,
      } : undefined as unknown as MiniAccount,
      category: all[0].category ? {
        id: all[0].category.id,
        accountId: all[0].category.accountId,
        name: all[0].category.name,
        type: all[0].category.type,
        color: all[0].category.color,
        icon: all[0].category.icon,
      } : undefined,
      attachments: [],
    } as TransactionWithRelations;

    all.forEach((row) => {
      if (row.attachments) {
        if (!mainTx.attachments.some(a => a.id === row.attachments!.id)) {
          mainTx.attachments.push({
            id: row.attachments.id,
            accountId: row.attachments.accountId,
            transactionId: row.attachments.transactionId,
            type: row.attachments.type,
            localUri: row.attachments.localUri,
          });
        }
      }
    });

    // Similar transactions (same category or same account, limit 5 by default)
    const similarLimit = options?.similarLimit ?? 5;
    let similarTransactions: TransactionWithRelations[] = [];

    if (similarLimit > 0) {
      const similarOptions: GetAllTransactionsOptions = {
        limit: similarLimit + 1,
        categoryId: mainTx.categoryId || undefined,
      };
      const similarResult = await this.getPaginatedForAccount(mainTx.accountId, similarOptions);
      similarTransactions = similarResult.data.filter(t => t.id !== mainTx.id).slice(0, similarLimit);
    }

    return {
      transaction: mainTx,
      similarTransactions,
    };
  },

  async delete(transactionId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, transactionId));
  },
};
