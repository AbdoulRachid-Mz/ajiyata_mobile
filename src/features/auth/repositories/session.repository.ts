import { db } from "@/db";
import { authSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateUUID } from "@/utils/uuid";

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export const sessionRepository = {
  async create(data: Omit<NewAuthSession, "id" | "createdAt" | "updatedAt" | "lastLogin">): Promise<AuthSession> {
    const id = generateUUID();
    const now = new Date();
    
    const [session] = await db.insert(authSessions).values({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
    }).returning();
    
    return session;
  },

  async getById(id: string): Promise<AuthSession | undefined> {
    const [session] = await db.select().from(authSessions).where(eq(authSessions.id, id));
    return session;
  },

  async getByFirebaseUid(uid: string): Promise<AuthSession | undefined> {
    const [session] = await db.select().from(authSessions).where(eq(authSessions.firebaseUid, uid));
    return session;
  },

  async update(id: string, data: Partial<Omit<AuthSession, "id" | "createdAt">>): Promise<AuthSession | undefined> {
    const [session] = await db.update(authSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(authSessions.id, id))
      .returning();
      
    return session;
  },

  async updateLastLogin(id: string): Promise<void> {
    await db.update(authSessions)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(authSessions.id, id));
  },

  async delete(id: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.id, id));
  },
  
  async getLocalSession(): Promise<AuthSession | undefined> {
    // Il peut y avoir plusieurs sessions locales si on réinstalle sans supprimer
    // On prend la plus récente.
    const [session] = await db.select()
      .from(authSessions)
      .where(eq(authSessions.isLocal, true))
      .orderBy(desc(authSessions.createdAt))
      .limit(1);
    return session;
  }
};
