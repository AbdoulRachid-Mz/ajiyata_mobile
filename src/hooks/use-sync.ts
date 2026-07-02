import { useSync } from '@/providers/sync-provider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FirebaseSyncService } from '@/services/firebase/sync.service';
import { SyncEntity } from '@/features/sync/types';

export const useSyncAll = () => {
  const { syncAll, refreshSyncStatus } = useSync();
  
  return useMutation({
    mutationFn: syncAll,
    onSuccess: () => {
      refreshSyncStatus();
    },
  });
};

export const useSyncEntity = () => {
  const { refreshSyncStatus } = useSync();
  const syncService = FirebaseSyncService.getInstance();

  return useMutation({
    mutationFn: async ({ entityName }: { entityName: SyncEntity }) => {
      await syncService.syncEntityManually(entityName);
    },
    onSuccess: () => {
      refreshSyncStatus();
    },
  });
};

export const useSyncStatus = () => {
  const { syncStatus, refreshSyncStatus } = useSync();
  
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      await refreshSyncStatus();
      return syncStatus;
    },
    enabled: false,
    initialData: syncStatus,
  });
};