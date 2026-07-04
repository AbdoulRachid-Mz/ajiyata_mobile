import { firestore } from "@/configs/firebase/config";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type { SyncEntity } from "@/features/sync/types";
import { Storage } from "@/lib/storage";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";

const STORAGE_KEY_LAST_BACKUP = "ajiya_last_backup";
const STORAGE_KEY_LAST_RESTORE = "ajiya_last_restore";

export class SyncService {
  private static instance: SyncService;

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private getTable(entity: SyncEntity) {
    const tables = {
      users: schema.users,
      accounts: schema.accounts,
      transactions: schema.transactions,
      categories: schema.categories,
      budgets: schema.budgets,
      savingGoals: schema.savingGoals,
      attachments: schema.attachments,
      settings: schema.settings,
    };
    return tables[entity];
  }

  private getCollectionName(entity: SyncEntity): string {
    const collections: Record<SyncEntity, string> = {
      users: "users",
      accounts: "accounts",
      transactions: "transactions",
      categories: "categories",
      budgets: "budgets",
      savingGoals: "saving_goals",
      attachments: "attachments",
      settings: "settings",
    };
    return collections[entity];
  }

  private prepareForFirestore(data: any): any {
    const result = { ...data };
    const dateFields = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "lastSyncedAt",
      "date",
      "startDate",
      "endDate",
      "deadline",
      "lastActiveAt",
    ];

    for (const field of dateFields) {
      if (result[field] && result[field] instanceof Date) {
        result[field] = Timestamp.fromDate(result[field]);
      }
    }

    delete result.syncStatus;
    delete result.isSynced;
    return result;
  }

  private prepareForSQLite(data: any): any {
    const result = { ...data };
    const dateFields = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "lastSyncedAt",
      "date",
      "startDate",
      "endDate",
      "deadline",
      "lastActiveAt",
    ];

    for (const field of dateFields) {
      if (result[field] && result[field].toDate) {
        result[field] = result[field].toDate();
      }
    }

    return result;
  }

  // ============================================
  // CHECK FOR EXISTING DATA IN FIRESTORE
  // ============================================
  private async checkDuplicate(
    entity: SyncEntity,
    data: any,
    userId: string,
  ): Promise<boolean> {
    const collectionName = this.getCollectionName(entity);

    try {
      if (entity === "users" && data.email) {
        const q = query(
          collection(firestore, collectionName),
          where("email", "==", data.email),
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      }

      if (entity === "accounts" && data.userId && data.name) {
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
          where("name", "==", data.name),
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      }

      if (entity === "categories" && data.accountId && data.name && data.type) {
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
          where("accountId", "==", data.accountId),
          where("name", "==", data.name),
          where("type", "==", data.type),
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      }

      if (
        entity === "transactions" &&
        data.accountId &&
        data.title &&
        data.amount &&
        data.date
      ) {
        const txDate =
          data.date instanceof Date ? data.date : new Date(data.date);
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
          where("accountId", "==", data.accountId),
          where("title", "==", data.title),
          where("amount", "==", data.amount),
        );
        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
          const docData = doc.data();
          const docDate = docData.date?.toDate
            ? docData.date.toDate()
            : new Date(docData.date);

          const timeDiff = Math.abs(txDate.getTime() - docDate.getTime());
          if (timeDiff < 86400000) {
            // Within 24 hours
            return true;
          }
        }
        return false;
      }

      if (
        entity === "budgets" &&
        data.accountId &&
        data.categoryId &&
        data.period
      ) {
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
          where("accountId", "==", data.accountId),
          where("categoryId", "==", data.categoryId),
          where("period", "==", data.period),
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      }

      if (entity === "savingGoals" && data.accountId && data.title) {
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
          where("accountId", "==", data.accountId),
          where("title", "==", data.title),
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      }

      return false;
    } catch (error) {
      console.error(`Error checking duplicates for ${entity}:`, error);
      return false;
    }
  }

  // ============================================
  // BACKUP TO FIRESTORE
  // ============================================
  async backupToCloud(
    userId: string,
  ): Promise<{ success: boolean; message: string; count: number }> {
    let backedUpCount = 0;

    try {
      // Skip 'users' entity for backup - we'll handle user profile separately
      const entities: SyncEntity[] = [
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "savingGoals",
        "settings",
      ];
      let batch = writeBatch(firestore);
      const batchSize = 500;
      let currentBatchSize = 0;

      for (const entity of entities) {
        const table = this.getTable(entity);
        if (!table) continue;

        // @ts-ignore - Dynamic query
        const items = await db.select().from(table);

        for (const item of items) {
          const itemWithUserId = { ...item, userId };
          const isDuplicate = await this.checkDuplicate(
            entity,
            itemWithUserId,
            userId,
          );

          if (!isDuplicate) {
            const collectionName = this.getCollectionName(entity);
            // Top-level collection with userId field
            const docRef = doc(firestore, collectionName, item.id);
            const firestoreData = this.prepareForFirestore(itemWithUserId);
            firestoreData.backedUpAt = Timestamp.now();

            batch.set(docRef, firestoreData, { merge: true });
            currentBatchSize++;
            backedUpCount++;

            if (currentBatchSize >= batchSize) {
              await batch.commit();
              batch = writeBatch(firestore);
              currentBatchSize = 0;
            }
          }
        }
      }

      if (currentBatchSize > 0) {
        await batch.commit();
      }

      await Storage.setItem(STORAGE_KEY_LAST_BACKUP, new Date().toISOString());

      return {
        success: true,
        message: `Sauvegarde terminée avec succès (${backedUpCount} éléments)`,
        count: backedUpCount,
      };
    } catch (error) {
      console.error("Backup error:", error);
      return {
        success: false,
        message: "Erreur lors de la sauvegarde",
        count: backedUpCount,
      };
    }
  }

  // ============================================
  // RESTORE FROM FIRESTORE
  // ============================================
  async restoreFromCloud(
    userId: string,
  ): Promise<{ success: boolean; message: string; count: number }> {
    let restoredCount = 0;

    try {
      const entities: SyncEntity[] = [
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "savingGoals",
        "settings",
      ];

      for (const entity of entities) {
        const table = this.getTable(entity);
        if (!table) continue;

        const collectionName = this.getCollectionName(entity);
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) continue;

        // @ts-ignore - Dynamic delete
        await db.delete(table);

        for (const docSnapshot of snapshot.docs) {
          const data = this.prepareForSQLite(docSnapshot.data());
          data.id = docSnapshot.id;

          // @ts-ignore - Dynamic insert
          await db.insert(table).values(data);
          restoredCount++;
        }
      }

      await Storage.setItem(STORAGE_KEY_LAST_RESTORE, new Date().toISOString());

      return {
        success: true,
        message: `Restauration terminée avec succès (${restoredCount} éléments)`,
        count: restoredCount,
      };
    } catch (error) {
      console.error("Restore error:", error);
      return {
        success: false,
        message: "Erreur lors de la restauration",
        count: restoredCount,
      };
    }
  }

  // ============================================
  // DELETE DATA METHODS
  // ============================================
  async deleteLocalData(): Promise<void> {
    try {
      const entities: SyncEntity[] = [
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "savingGoals",
        "attachments",
        "settings",
      ];

      for (const entity of entities) {
        const table = this.getTable(entity);
        if (!table) continue;

        // @ts-ignore - Dynamic delete
        await db.delete(table);
      }

      // Also clear sync-related storage
      await Storage.removeItem(STORAGE_KEY_LAST_BACKUP);
      await Storage.removeItem(STORAGE_KEY_LAST_RESTORE);
    } catch (error) {
      console.error("Error deleting local data:", error);
      throw error;
    }
  }

  async deleteCloudData(userId: string): Promise<void> {
    try {
      const entities: SyncEntity[] = [
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "savingGoals",
        "attachments",
        "settings",
      ];
      let batch = writeBatch(firestore);
      let batchSize = 0;
      const maxBatchSize = 500;

      for (const entity of entities) {
        const collectionName = this.getCollectionName(entity);
        const q = query(
          collection(firestore, collectionName),
          where("userId", "==", userId),
        );
        const snapshot = await getDocs(q);

        for (const docSnapshot of snapshot.docs) {
          batch.delete(doc(firestore, collectionName, docSnapshot.id));
          batchSize++;

          if (batchSize >= maxBatchSize) {
            await batch.commit();
            batch = writeBatch(firestore);
            batchSize = 0;
          }
        }
      }

      if (batchSize > 0) {
        await batch.commit();
      }

      await Storage.removeItem(STORAGE_KEY_LAST_BACKUP);
      await Storage.removeItem(STORAGE_KEY_LAST_RESTORE);
    } catch (error) {
      console.error("Error deleting cloud data:", error);
      throw error;
    }
  }

  // ============================================
  // STATUS METHODS
  // ============================================
  async hasCloudData(userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(firestore, "accounts"),
        where("userId", "==", userId),
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking cloud data:", error);
      return false;
    }
  }

  async getLastBackupDate(): Promise<string | null> {
    return await Storage.getItem<string>(STORAGE_KEY_LAST_BACKUP);
  }

  async getLastRestoreDate(): Promise<string | null> {
    return await Storage.getItem<string>(STORAGE_KEY_LAST_RESTORE);
  }
}

export const syncService = SyncService.getInstance();
