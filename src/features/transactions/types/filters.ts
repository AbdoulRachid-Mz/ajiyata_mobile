import { Transaction } from '@/types';

export type TransactionType = 'income' | 'expense' | 'transfer' | 'all';

export type SortField = 'date' | 'amount' | 'type' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface TransactionFilters {
  // Filtres de base
  search?: string;
  type: TransactionType;
  categoryIds?: string[];
  
  // Filtres de date
  dateRange?: {
    start: Date;
    end: Date;
  };
  presetDate?: 'today' | 'week' | 'month' | 'year' | 'custom';
  
  // Filtres de montant
  minAmount?: number;
  maxAmount?: number;
  
  // Tri
  sortField: SortField;
  sortDirection: SortDirection;
  
  // Filtres supplémentaires
  hasAttachments?: boolean;
  hasNote?: boolean;
  isSynced?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<TransactionFilters>;
  icon: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  filters: FilterPreset[];
}

export type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';