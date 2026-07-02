export type SyncEntity = 
  | 'users'
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'savingGoals'
  | 'attachments'
  | 'settings';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type SyncAction = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id: string;
  entity: SyncEntity;
  entityId: string;
  action: SyncAction;
  data?: Record<string, any>;
  status: SyncStatus;
  createdAt: Date;
  retryCount: number;
  error?: string;
}

export interface SyncMetadata {
  deviceId: string;
  userId: string;
  lastSyncAt: Date;
  syncedEntities: {
    [key in SyncEntity]?: Date;
  };
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  retryAttempts: number;
  retryDelay: number; // seconds
}