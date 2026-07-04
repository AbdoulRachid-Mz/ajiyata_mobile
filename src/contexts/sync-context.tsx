import { syncService } from "@/services/sync/SyncService";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./auth-context";

interface SyncContextType {
  isSyncing: boolean;
  hasCloudData: boolean;
  lastBackupDate: string | null;
  lastRestoreDate: string | null;
  backupToCloud: () => Promise<{
    success: boolean;
    message: string;
    count: number;
  }>;
  restoreFromCloud: () => Promise<{
    success: boolean;
    message: string;
    count: number;
  }>;
  deleteLocalData: () => Promise<{ success: boolean; message: string }>;
  deleteCloudData: () => Promise<{ success: boolean; message: string }>;
  refreshStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasCloudData, setHasCloudData] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [lastRestoreDate, setLastRestoreDate] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const refreshStatus = async () => {
    try {
      if (isAuthenticated && user?.uid) {
        const hasData = await syncService.hasCloudData(user.uid);
        setHasCloudData(hasData);
      }

      const lastBackup = await syncService.getLastBackupDate();
      const lastRestore = await syncService.getLastRestoreDate();

      setLastBackupDate(lastBackup);
      setLastRestoreDate(lastRestore);
    } catch (error) {
      console.error("Error refreshing sync status:", error);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [isAuthenticated, user?.uid]);

  const backupToCloud = async (): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> => {
    if (!isAuthenticated || !user?.uid) {
      return {
        success: false,
        message: "Veuillez vous connecter pour sauvegarder vos données",
        count: 0,
      };
    }

    setIsSyncing(true);
    try {
      const result = await syncService.backupToCloud(user.uid);
      await refreshStatus();
      return result;
    } catch (error) {
      console.error("Backup error:", error);
      return {
        success: false,
        message: "Erreur lors de la sauvegarde",
        count: 0,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreFromCloud = async (): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> => {
    if (!isAuthenticated || !user?.uid) {
      return {
        success: false,
        message: "Veuillez vous connecter pour restaurer vos données",
        count: 0,
      };
    }

    setIsSyncing(true);
    try {
      const result = await syncService.restoreFromCloud(user.uid);
      await refreshStatus();
      return result;
    } catch (error) {
      console.error("Restore error:", error);
      return {
        success: false,
        message: "Erreur lors de la restauration",
        count: 0,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteLocalData = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    setIsSyncing(true);
    try {
      await syncService.deleteLocalData();
      await refreshStatus();
      return {
        success: true,
        message: "Données locales supprimées avec succès",
      };
    } catch (error) {
      console.error("Delete local data error:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression des données locales",
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteCloudData = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!isAuthenticated || !user?.uid) {
      return {
        success: false,
        message: "Veuillez vous connecter pour supprimer les données cloud",
      };
    }

    setIsSyncing(true);
    try {
      await syncService.deleteCloudData(user.uid);
      await refreshStatus();
      return {
        success: true,
        message: "Données cloud supprimées avec succès",
      };
    } catch (error) {
      console.error("Delete cloud data error:", error);
      return {
        success: false,
        message: "Erreur lors de la suppression des données cloud",
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const value: SyncContextType = {
    isSyncing,
    hasCloudData,
    lastBackupDate,
    lastRestoreDate,
    backupToCloud,
    restoreFromCloud,
    deleteLocalData,
    deleteCloudData,
    refreshStatus,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
