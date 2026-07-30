// src/utils/filter-utils.ts

import { Transaction } from '@/types';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { DatePreset, SortDirection, SortField, TransactionFilters } from '@/features/transactions/types/filters';
import i18n from '@/configs/i18n';

export const filterTransactions = (
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] => {
  let filtered = [...transactions];

  // Filtre par recherche
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim();
    filtered = filtered.filter(tx =>
      tx.title.toLowerCase().includes(searchLower) ||
      (tx.note && tx.note.toLowerCase().includes(searchLower))
    );
  }

  // Filtre par type
  if (filters.type !== 'all') {
    filtered = filtered.filter(tx => tx.type === filters.type);
  }

  // Filtre par catégories
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filtered = filtered.filter(tx => 
      tx.categoryId && filters.categoryIds!.includes(tx.categoryId)
    );
  }

  // Filtre par date
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
  } else if (filters.presetDate && filters.presetDate !== 'custom') {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (filters.presetDate) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfDay(subWeeks(now, 1));
        break;
      case 'month':
        start = startOfDay(subMonths(now, 1));
        break;
      case 'year':
        start = startOfDay(subYears(now, 1));
        break;
      default:
        start = startOfDay(now);
    }

    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
  }

  // Filtre par montant
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter(tx => tx.amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter(tx => tx.amount <= filters.maxAmount!);
  }

  // Filtre par pièces jointes
  if (filters.hasAttachments !== undefined) {
    // À implémenter avec la table attachments
  }

  // Filtre par note
  if (filters.hasNote !== undefined) {
    filtered = filtered.filter(tx => 
      filters.hasNote ? (tx.note && tx.note.length > 0) : (!tx.note || tx.note.length === 0)
    );
  }

  // Filtre par statut de synchronisation
  if (filters.isSynced !== undefined) {
    filtered = filtered.filter(tx => tx.isSynced === filters.isSynced);
  }

  // Tri
  filtered = sortTransactions(filtered, filters.sortField, filters.sortDirection);

  return filtered;
};

export const sortTransactions = (
  transactions: Transaction[],
  field: SortField,
  direction: SortDirection
): Transaction[] => {
  const sorted = [...transactions];
  const multiplier = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (field) {
      case 'date':
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      case 'amount':
        return (a.amount - b.amount) * multiplier;
      case 'type':
        return (a.type.localeCompare(b.type)) * multiplier;
      case 'title':
        return (a.title.localeCompare(b.title)) * multiplier;
      default:
        return 0;
    }
  });

  return sorted;
};

export const getDatePresetRange = (preset: DatePreset): { start: Date; end: Date } => {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) };
    case 'month':
      return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
    case 'year':
      return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) };
    default:
      return { start, end };
  }
};

export const getFilterSummary = (filters: TransactionFilters): string => {
  const t = i18n.t.bind(i18n);
  const parts: string[] = [];

  if (filters.type && filters.type !== 'all') {
    parts.push(filters.type === 'income' ? t('finance.income') : filters.type === 'expense' ? t('finance.expense') : t('finance.transfer'));
  }

  if (filters.search && filters.search.trim()) {
    parts.push(`"${filters.search.trim()}"`);
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    parts.push(`${filters.categoryIds.length} ${t('finance.category')}${filters.categoryIds.length > 1 ? 's' : ''}`);
  }

  if (filters.presetDate && filters.presetDate !== 'custom') {
    const labels: Record<DatePreset, string> = {
      today: t('periods.today'),
      week: t('periods.this_week'),
      month: t('periods.this_month'),
      year: t('periods.this_year'),
      custom: t('periods.custom'),
    };
    parts.push(labels[filters.presetDate]);
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const min = filters.minAmount !== undefined ? `≥ ${filters.minAmount}` : '';
    const max = filters.maxAmount !== undefined ? `≤ ${filters.maxAmount}` : '';
    parts.push(`${min}${min && max ? ' & ' : ''}${max}`);
  }

  return parts.length > 0 ? `${t('common.filters')}: ${parts.join(' • ')}` : t('transactions.all_transactions');
};