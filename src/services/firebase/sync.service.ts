// import { firestore } from '@/configs/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, isNotNull, SQL } from 'drizzle-orm';
import { generateUUID, getCurrentTimestamp } from '@/utils/uuid';
import { Storage } from '@/lib/storage';
import type { SyncEntity, SyncStatus } from '@/features/sync/types';
import { firestore } from '@/configs/firebase/config';
import NetInfo from '@react-native-community/netinfo';
import { CloudinaryUploadService } from '@/services/cloudinary/upload.service';

// Interface pour les données synchronisables
interface SyncableEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  syncStatus: SyncStatus;
  lastSyncedAt?: Date | null;
  version: number;
  deviceId: string;
  metadata: Record<string, any>;
}

export class FirebaseSyncService {
  private static instance: FirebaseSyncService;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;

  private constructor() {}

  static getInstance(): FirebaseSyncService {
    if (!FirebaseSyncService.instance) {
      FirebaseSyncService.instance = new FirebaseSyncService();
    }
    return FirebaseSyncService.instance;
  }

  /**
   * Démarrer la synchronisation automatique
   */
  startAutoSync(intervalMinutes: number = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncAll().catch(console.error);
    }, intervalMinutes * 60 * 1000) as unknown as number;

    // Première synchronisation immédiate
    this.syncAll().catch(console.error);
  }

  /**
   * Arrêter la synchronisation automatique
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Synchroniser toutes les entités
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('📶 Pas de connexion internet, synchronisation ignorée');
      return;
    }
    
    this.isSyncing = true;
    console.log('🔄 Début de la synchronisation...');

    try {
      const userId = await Storage.getSession();
      if (!userId) {
        console.log('⚠️ Utilisateur non connecté, synchronisation ignorée');
        return;
      }

      // Récupérer le deviceId
      const deviceId = await Storage.getCurrentDeviceId() || 'unknown-device';

      // Synchroniser chaque entité
      await this.syncEntity('users', userId, deviceId);
      await this.syncEntity('accounts', userId, deviceId);
      await this.syncEntity('categories', userId, deviceId);
      await this.syncEntity('transactions', userId, deviceId);
      await this.syncEntity('budgets', userId, deviceId);
      await this.syncEntity('savingGoals', userId, deviceId);
      await this.syncEntity('settings', userId, deviceId);

      // Mettre à jour le timestamp de dernière synchronisation
      await Storage.setItem('last_sync_at', new Date().toISOString());

      console.log('✅ Synchronisation terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchroniser une entité spécifique
   */
  private async syncEntity(
    entityName: SyncEntity,
    userId: string,
    deviceId: string
  ): Promise<void> {
    console.log(`🔄 Synchronisation de ${entityName}...`);

    try {
      // 1. Envoyer les données locales vers Firestore
      await this.pushLocalToFirestore(entityName, userId, deviceId);

      // 2. Récupérer les données Firestore vers SQLite
      await this.pullFirestoreToLocal(entityName, userId);

      console.log(`✅ ${entityName} synchronisé avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la synchronisation de ${entityName}:`, error);
      throw error;
    }
  }

  /**
   * Pousser les données locales vers Firestore
   */
  private async pushLocalToFirestore(
    entityName: SyncEntity,
    userId: string,
    deviceId: string
  ): Promise<void> {
    // Récupérer les entités en attente de synchronisation
    const table = this.getTable(entityName);
    
    // Vérifier que la table existe
    if (!table) {
      console.warn(`⚠️ Table ${entityName} non trouvée`);
      return;
    }

    try {
      // @ts-ignore - Requête dynamique
      const pendingEntities = await db
        .select()
        .from(table)
        .where(eq(table.syncStatus, 'pending'));

      if (!pendingEntities || pendingEntities.length === 0) {
        return;
      }

      console.log(`📤 ${pendingEntities.length} ${entityName} à synchroniser vers Firestore`);

      const batch = writeBatch(firestore);
      const collectionName = this.getCollectionName(entityName);

      for (const entity of pendingEntities) {
        try {
          const docRef = doc(firestore, collectionName, entity.id);
          
          // Uploader les pièces jointes locales vers Cloudinary si nécessaire
          const entityWithCloudUrls = await this.uploadAttachmentsIfNeeded(entity);
          
          // Préparer les données pour Firestore
          const firestoreData = this.prepareForFirestore(entityWithCloudUrls);
          firestoreData.syncedAt = Timestamp.now();
          firestoreData.deviceId = deviceId;
          firestoreData.userId = userId;

          // Pour les catégories et comptes, vérifier les doublons par nom avant d'insérer
          if ((entityName === 'categories' || entityName === 'accounts') && entity.name) {
            const dupQ = query(
              collection(firestore, collectionName),
              where('userId', '==', userId),
              where('name', '==', entity.name)
            );
            const dupSnap = await getDocs(dupQ);
            const existingDocs = dupSnap.docs.filter(d => d.id !== entity.id);
            if (existingDocs.length > 0) {
              // Doublon trouvé -> marquer comme synced sans pousser un nouveau doc
              console.log(`⚠️ ${entityName} dupliqué ignoré: "${entity.name}"`);
              // @ts-ignore
              await db.update(table)
                .set({ syncStatus: 'synced', lastSyncedAt: new Date() })
                .where(eq(table.id, entity.id));
              continue;
            }
          }

          // Pour les transactions, vérifier les doublons par titre + montant + date
          if (entityName === 'transactions' && entity.title && entity.amount) {
            const txDate = entity.date instanceof Date 
              ? Timestamp.fromDate(entity.date) 
              : entity.date;
            const dupQ = query(
              collection(firestore, collectionName),
              where('userId', '==', userId),
              where('title', '==', entity.title),
              where('amount', '==', entity.amount)
            );
            const dupSnap = await getDocs(dupQ);
            const existingDocs = dupSnap.docs.filter(d => d.id !== entity.id);
            if (existingDocs.length > 0) {
              console.log(`⚠️ Transaction dupliquée ignorée: "${entity.title}" - ${entity.amount}`);
              // @ts-ignore
              await db.update(table)
                .set({ syncStatus: 'synced', lastSyncedAt: new Date() })
                .where(eq(table.id, entity.id));
              continue;
            }
          }

          batch.set(docRef, firestoreData, { merge: true });

          // Marquer comme synchronisé en local
          // @ts-ignore
          await db.update(table)
            .set({ 
              syncStatus: 'synced', 
              lastSyncedAt: new Date() 
            })
            .where(eq(table.id, entity.id));

        } catch (error) {
          console.error(`❌ Erreur lors de la synchronisation de ${entityName} ${entity.id}:`, error);
          // Marquer comme échec
          // @ts-ignore
          await db.update(table)
            .set({ syncStatus: 'failed' })
            .where(eq(table.id, entity.id));
        }
      }

      await batch.commit();
      console.log(`✅ ${pendingEntities.length} ${entityName} synchronisés vers Firestore`);
    } catch (error) {
      console.error(`❌ Erreur lors du push de ${entityName}:`, error);
    }
  }

  /**
   * Récupérer les données Firestore vers SQLite
   */
  private async pullFirestoreToLocal(
    entityName: SyncEntity,
    userId: string
  ): Promise<void> {
    const collectionName = this.getCollectionName(entityName);
    const table = this.getTable(entityName);

    if (!table) {
      console.warn(`⚠️ Table ${entityName} non trouvée`);
      return;
    }

    try {
      // Récupérer les entités Firestore
      const q = query(
        collection(firestore, collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return;
      }

      console.log(`📥 ${querySnapshot.size} ${entityName} récupérés de Firestore`);

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const localId = docSnapshot.id;

        try {
          // Vérifier si l'entité existe déjà localement
          // @ts-ignore
          const existing = await db
            .select()
            .from(table)
            .where(eq(table.id, localId))
            .limit(1);

          if (existing.length === 0) {
            // Nouvelle entité - vérifier si un doublon existe par nom (pour catégories/comptes)
            if ((entityName === 'categories' || entityName === 'accounts') && data.name) {
              // @ts-ignore
              const dupCheck = await db
                .select()
                .from(table)
                .where(eq(table.name, data.name))
                .limit(1);
              
              if (dupCheck.length > 0) {
                // Doublon par nom trouvé - comparer updatedAt et garder le plus récent
                const localUpdated = dupCheck[0].updatedAt ? new Date(dupCheck[0].updatedAt).getTime() : 0;
                const remoteUpdated = data.updatedAt?.toDate ? data.updatedAt.toDate().getTime() : 0;
                
                if (remoteUpdated > localUpdated) {
                  const localData = this.prepareForSQLite(data);
                  localData.id = dupCheck[0].id; // Garder l'ID local
                  // @ts-ignore
                  await db.update(table)
                    .set({ ...localData, syncStatus: 'synced', lastSyncedAt: new Date() })
                    .where(eq(table.id, dupCheck[0].id));
                  console.log(`🔄 ${entityName} fusionné (doublon par nom): "${data.name}"`);
                } else {
                  console.log(`⏭️ ${entityName} local plus récent, doublon ignoré: "${data.name}"`);
                }
                continue;
              }
            }
            
            // Aucun doublon - insérer normalement
            const localData = this.prepareForSQLite(data);
            // @ts-ignore
            await db.insert(table).values(localData);
            console.log(`✅ Nouveau ${entityName} inséré: ${localId}`);
          } else {
            // Entité existante - vérifier la version ET updatedAt
            const localVersion = existing[0].version || 0;
            const remoteVersion = data.version || 0;
            const localUpdated = existing[0].updatedAt ? new Date(existing[0].updatedAt).getTime() : 0;
            const remoteUpdated = data.updatedAt?.toDate ? data.updatedAt.toDate().getTime() : 0;

            if (data.deletedAt) {
              // Suppression distante
              // @ts-ignore
              await db.delete(table).where(eq(table.id, localId));
              console.log(`🗑️ ${entityName} supprimé: ${localId}`);
            } else if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteUpdated > localUpdated)) {
              // Firebase est plus récent - mettre à jour
              const localData = this.prepareForSQLite(data);
              // @ts-ignore
              await db.update(table)
                .set({ ...localData, syncStatus: 'synced', lastSyncedAt: new Date() })
                .where(eq(table.id, localId));
              console.log(`✅ ${entityName} mis à jour: ${localId}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de ${entityName} ${localId}:`, error);
        }
      }

      console.log(`✅ ${entityName} récupérés de Firestore avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de ${entityName}:`, error);
    }
  }

  /**
   * Préparer les données pour Firestore
   */
  private prepareForFirestore(entity: any): Record<string, any> {
    const data: Record<string, any> = { ...entity };

    // Convertir les dates en Timestamp Firestore
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'lastSyncedAt', 'date', 'startDate', 'endDate', 'deadline', 'lastActiveAt'];
    for (const field of dateFields) {
      if (data[field] instanceof Date) {
        data[field] = Timestamp.fromDate(data[field]);
      }
    }

    // Supprimer les champs qui ne doivent pas être synchronisés
    delete data.syncStatus;
    delete data.isSynced;

    return data;
  }

  /**
   * Upload les pièces jointes locales vers Cloudinary avant sync
   * Remplace les URIs locales (file://) par des URLs Cloudinary
   */
  private async uploadAttachmentsIfNeeded(entity: any): Promise<any> {
    const data = { ...entity };
    
    // Vérifier si l'entité a des pièces jointes (attachments ou images)
    const attachmentFields = ['attachments', 'images', 'receiptUrl', 'imageUrl', 'photoUrl'];
    const uploader = CloudinaryUploadService.getInstance();
    
    for (const field of attachmentFields) {
      if (!data[field]) continue;
      
      if (typeof data[field] === 'string' && data[field].startsWith('file://')) {
        // Single local URI
        try {
          console.log(`☁️ Upload pièce jointe vers Cloudinary: ${field}`);
          const result = await uploader.uploadImage(data[field]);
          data[field] = result.secureUrl;
          console.log(`✅ Pièce jointe uploadée: ${result.secureUrl}`);
        } catch (err) {
          console.warn(`⚠️ Upload échoué pour ${field}, URI locale conservée:`, err);
        }
      } else if (Array.isArray(data[field])) {
        // Array of URIs
        const uploaded: string[] = [];
        for (const uri of data[field]) {
          if (typeof uri === 'string' && uri.startsWith('file://')) {
            try {
              const result = await uploader.uploadImage(uri);
              uploaded.push(result.secureUrl);
              console.log(`✅ Pièce jointe uploadée: ${result.secureUrl}`);
            } catch (err) {
              console.warn(`⚠️ Upload échoué pour une image, URI locale conservée:`, err);
              uploaded.push(uri); // Keep local URI as fallback
            }
          } else {
            uploaded.push(uri); // Already a cloud URL
          }
        }
        data[field] = uploaded;
      }
    }
    
    return data;
  }

  /**
   * Préparer les données pour SQLite
   */
  private prepareForSQLite(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = { ...data };

    // Convertir les Timestamp Firestore en Date
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'lastSyncedAt', 'date', 'startDate', 'endDate', 'deadline', 'lastActiveAt'];
    for (const field of dateFields) {
      if (data[field] && data[field].toDate) {
        result[field] = data[field].toDate();
      }
    }

    // Supprimer les champs Firestore
    delete result.syncedAt;

    return result;
  }

  /**
   * Obtenir la table Drizzle correspondante
   */
  private getTable(entityName: SyncEntity): any {
    const tables: Record<SyncEntity, any> = {
      users: schema.users,
      accounts: schema.accounts,
      transactions: schema.transactions,
      categories: schema.categories,
      budgets: schema.budgets,
      savingGoals: schema.savingGoals,
      attachments: schema.attachments,
      settings: schema.settings,
    };
    return tables[entityName];
  }

  /**
   * Obtenir le nom de la collection Firestore
   */
  private getCollectionName(entityName: SyncEntity): string {
    const collections: Record<SyncEntity, string> = {
      users: 'users',
      accounts: 'accounts',
      transactions: 'transactions',
      categories: 'categories',
      budgets: 'budgets',
      savingGoals: 'saving_goals',
      attachments: 'attachments',
      settings: 'settings',
    };
    return collections[entityName];
  }

  /**
   * Synchroniser manuellement une entité spécifique
   */
  async syncEntityManually(entityName: SyncEntity): Promise<void> {
    const userId = await Storage.getSession();
    const deviceId = await Storage.getCurrentDeviceId() || 'unknown-device';
    
    if (!userId) {
      throw new Error('Utilisateur non connecté');
    }

    await this.syncEntity(entityName, userId, deviceId);
  }

  /**
   * Vérifier l'état de la synchronisation
   */
  async getSyncStatus(): Promise<{
    pending: number;
    total: number;
    lastSyncAt: string | null;
  }> {
    const entities: SyncEntity[] = [
      'users', 'accounts', 'transactions', 
      'categories', 'budgets', 'savingGoals'
    ];

    let pending = 0;
    let total = 0;

    for (const entityName of entities) {
      const table = this.getTable(entityName);
      if (!table) continue;

      try {
        // @ts-ignore
        const results = await db.select().from(table);
        total += results.length;
        
        // @ts-ignore
        const pendingResults = await db
          .select()
          .from(table)
          .where(eq(table.syncStatus, 'pending'));
        
        pending += pendingResults.length;
      } catch (error) {
        console.error(`Erreur pour ${entityName}:`, error);
      }
    }

    const lastSyncAt = await Storage.getItem<string>('last_sync_at');

    return {
      pending,
      total,
      lastSyncAt: lastSyncAt || null,
    };
  }

  /**
   * Nettoyer les entités supprimées
   */
  async cleanupDeletedEntities(): Promise<void> {
    const entities: SyncEntity[] = [
      'users', 'accounts', 'transactions', 
      'categories', 'budgets', 'savingGoals'
    ];

    for (const entityName of entities) {
      const table = this.getTable(entityName);
      if (!table) continue;

      try {
        // @ts-ignore
        await db.delete(table).where(isNotNull(table.deletedAt));
      } catch (error) {
        console.error(`Erreur lors du nettoyage de ${entityName}:`, error);
      }
    }
  }
}