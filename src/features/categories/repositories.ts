
import { db } from '@/db';
import { categories } from '@/db/schema';
import type { NewCategory, Category } from '@/types';
import { eq, and } from 'drizzle-orm';

export const categoryRepository = {
  async create(newCategory: NewCategory): Promise<Category> {
    const results = await db.insert(categories).values(newCategory).returning();
    return results[0];
  },

  async getAllForAccount(accountId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.accountId, accountId));
  },

  async getByType(accountId: string, type: 'income' | 'expense'): Promise<Category[]> {
    return await db.select().from(categories).where(and(eq(categories.accountId, accountId), eq(categories.type, type)));
  },

  async getById(categoryId: string): Promise<Category | null> {
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
    return category || null;
  },
};
