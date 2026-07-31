import { InferSelectModel, InferInsertModel, Relations, relations } from "drizzle-orm";
import { users, accounts, categories, transactions, attachments, budgets, savingGoals, exchangeRates, devices, syncLogs, settings } from "../db/schema";
// @/types/index.ts
// Base table types (select = existing record, insert = new record)
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type MiniUser = Pick<User, 'id' | 'name' | 'email'>;

// Type pour les métadonnées des transactions
export interface TransactionMetadata {
  client?: string;      // Pour les comptes business
  paidBy?: string;      // Pour les comptes family
  [key: string]: any;   // Pour extensibilité future
}

export type MiniAccount = Pick<Account, 'id' | 'userId' | 'name' | 'type' | 'currency'>;

export type MiniCategory = Pick<Category, 'id' | 'accountId' | 'name' | 'type' | 'color' | 'icon'>;

export type MiniTransaction = Pick<Transaction, 'id' | 'accountId' | 'categoryId' | 'type' | 'title' | 'amount' | 'currency' | 'date'>;

export type MiniAttachment = Pick<Attachment, 'id' | 'accountId' | 'transactionId' | 'type' | 'localUri'>;

export type MiniBudget = Pick<Budget, 'id' | 'accountId' | 'categoryId' | 'limit' | 'spent' | 'period' | 'startDate' | 'endDate' | 'status'>;

export type MiniSavingGoal = Pick<SavingGoal, 'id' | 'accountId' | 'title' | 'targetAmount' | 'currentAmount' | 'deadline' | 'status'>;

export type MiniExchangeRate = Pick<ExchangeRate, 'id' | 'baseCurrency' | 'targetCurrency' | 'rate'>;

export type MiniDevice = Pick<Device, 'id' | 'userId' | 'name' | 'platform' | 'lastActiveAt'>;

export type MiniSyncLog = Pick<SyncLog, 'id' | 'userId' | 'deviceId' | 'action' | 'entity' | 'entityId' | 'status'>;

export type MiniSetting = Pick<Setting, 'id' | 'userId' | 'theme' | 'language' | 'currency' | 'biometricEnabled' | 'syncEnabled'>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

// Mettre à jour le type Transaction
export type Transaction = InferSelectModel<typeof transactions> & {
  metadata?: TransactionMetadata | null;
};

export type NewTransaction = InferInsertModel<typeof transactions>;

export type Attachment = InferSelectModel<typeof attachments>;
export type NewAttachment = InferInsertModel<typeof attachments>;

export type Budget = InferSelectModel<typeof budgets>;
export type NewBudget = InferInsertModel<typeof budgets>;

export type SavingGoal = InferSelectModel<typeof savingGoals>;
export type NewSavingGoal = InferInsertModel<typeof savingGoals>;

export type ExchangeRate = InferSelectModel<typeof exchangeRates>;
export type NewExchangeRate = InferInsertModel<typeof exchangeRates>;

export type Device = InferSelectModel<typeof devices>;
export type NewDevice = InferInsertModel<typeof devices>;

export type SyncLog = InferSelectModel<typeof syncLogs>;
export type NewSyncLog = InferInsertModel<typeof syncLogs>;

export type Setting = InferSelectModel<typeof settings>;
export type NewSetting = InferInsertModel<typeof settings>;


export type AWithRelations = Account & {
  user: MiniUser;
  categories: MiniCategory[];
  transactions: MiniTransaction[];
  attachments: MiniAttachment[];
  budgets: MiniBudget[];
  savingGoals: MiniSavingGoal[];
};

export type CategoryWithRelations = Category & {
  account: MiniAccount;
  transactions: MiniTransaction[];
  budgets: MiniBudget[];
};

export type TransactionWithRelations = Transaction & {
  account: MiniAccount;
  category?: MiniCategory;
  attachments: MiniAttachment[];
};

export type AttachmentWithRelations = Attachment & {
  account: MiniAccount;
  transaction?: MiniTransaction;
};

export type BudgetWithRelations = Budget & {
  account: MiniAccount;
  category: MiniCategory;
  accountId?: string;
};

export type SavingGoalWithRelations = SavingGoal & {
  account: MiniAccount;
};

export type DeviceWithRelations = Device & {
  user: MiniUser;
  syncLogs: MiniSyncLog[];
};

export type SyncLogWithRelations = SyncLog & {
  user: MiniUser;
  device: MiniDevice;
};

export type SettingWithRelations = Setting & {
  user: MiniUser;
};

// Types pour la pagination, options et contexte/statistiques
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetByIdOptions {
  includeRelations?: boolean;
  similarLimit?: number; // Nombre d'éléments similaires (par défaut 5)
}

export interface GetAllTransactionsOptions extends PaginationOptions {
  search?: string;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  includeStats?: boolean;
}

export interface GetAllBudgetsOptions extends PaginationOptions {
  search?: string;
  status?: string;
  period?: string;
  includeStats?: boolean;
}

export interface GetAllGoalsOptions extends PaginationOptions {
  search?: string;
  status?: string;
  includeStats?: boolean;
}

export interface GetAllAccountsOptions extends PaginationOptions {
  userId?: string;
  type?: string;
  includeStats?: boolean;
}

// Context / Stats Types
export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCount: number;
}

export interface BudgetStats {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  exceededCount: number;
}

export interface GoalStats {
  totalTarget: number;
  totalCurrent: number;
  progressPercentage: number;
  completedCount: number;
}

export interface AccountStats {
  totalBalance: number;
  activeAccountsCount: number;
}

// Query result types with context/stats
export type TransactionQueryResult = PaginatedResult<TransactionWithRelations> & {
  stats?: TransactionStats;
};

export type BudgetQueryResult = PaginatedResult<BudgetWithRelations> & {
  stats?: BudgetStats;
};

export type GoalQueryResult = PaginatedResult<SavingGoalWithRelations> & {
  stats?: GoalStats;
};

export type AccountQueryResult = PaginatedResult<Account & { user?: MiniUser }> & {
  stats?: AccountStats;
};

// Detail result types with similar items context
export interface TransactionDetailResult {
  transaction: TransactionWithRelations;
  similarTransactions: TransactionWithRelations[];
}

export interface GoalDetailResult {
  goal: SavingGoalWithRelations;
  similarGoals: SavingGoalWithRelations[];
}

