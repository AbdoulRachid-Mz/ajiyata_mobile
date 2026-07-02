import { db } from '@/db';
import { attachments } from '@/db/schema';
import type { NewAttachment, Attachment } from '@/types';
import { eq, and } from 'drizzle-orm';

export const attachmentRepository = {
  async create(newAttachment: NewAttachment): Promise<Attachment> {
    const results = await db
      .insert(attachments)
      .values(newAttachment as any)
      .returning();
    return results[0] as Attachment;
  },

  async getAllForTransaction(transactionId: string): Promise<Attachment[]> {
    return (await db
      .select()
      .from(attachments)
      .where(eq(attachments.transactionId, transactionId))) as Attachment[];
  },

  async getById(attachmentId: string): Promise<Attachment | null> {
    const [attachment] = (await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))) as Attachment[];
    return attachment || null;
  },

  async delete(attachmentId: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, attachmentId));
  },

  async deleteForTransaction(transactionId: string): Promise<void> {
    await db
      .delete(attachments)
      .where(eq(attachments.transactionId, transactionId));
  },

  async update(attachmentId: string, data: Partial<Attachment>): Promise<Attachment> {
    const [updated] = await db
      .update(attachments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attachments.id, attachmentId))
      .returning();
    return updated as Attachment;
  },
};