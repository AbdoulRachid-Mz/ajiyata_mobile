import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FirebaseSyncService } from '@/services/firebase/sync.service';
import { useNetwork } from '@/providers/network-provider';
import { useAppStore } from '@/stores/app-store';

interface SyncContextType {
  isSyncing: boolean;
  syncAll: () => Promise<void>;
  syncStatus: {
    pending: number;
    total: number;
    lastSyncAt: string | null;
  } | null;
  refreshSyncStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncContextType['syncStatus']>(null);
  const { isConnected } = useNetwork();
  const { currentUser } = useAppStore();

  const syncService = FirebaseSyncService.getInstance();

  const refreshSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de sync:', error);
    }
  };

  const syncAll = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncService.syncAll();
      await refreshSyncStatus();
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchronisation automatique quand la connexion est rétablie
  useEffect(() => {
    if (isConnected && currentUser) {
      // Démarrer la sync automatique
      syncService.startAutoSync(5);
      
      // Refresh status
      refreshSyncStatus();
    } else {
      syncService.stopAutoSync();
    }

    return () => {
      syncService.stopAutoSync();
    };
  }, [isConnected, currentUser]);

  // Rafraîchir le statut périodiquement
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      refreshSyncStatus();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [currentUser]);

  const value: SyncContextType = {
    isSyncing,
    syncAll,
    syncStatus,
    refreshSyncStatus,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};