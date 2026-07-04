import { db } from "@/db";
import { users } from "@/db/schema";
import type { NewUser, User } from "@/types";
import { eq } from "drizzle-orm";

export const userRepository = {
  async create(newUser: NewUser): Promise<User> {
    const [created] = await db
      .insert(users)
      .values(newUser as any)
      .returning();
    return created as User;
  },

  async getById(userId: string): Promise<User | null> {
    const [user] = (await db
      .select()
      .from(users)
      .where(eq(users.id, userId))) as User[];
    return user || null;
  },

  async update(userId: string, updates: Partial<User>): Promise<User | null> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date(), syncStatus: "pending" } as any)
      .where(eq(users.id, userId))
      .returning();
    return updated as User | null;
  },
};
