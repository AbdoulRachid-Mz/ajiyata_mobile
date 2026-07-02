import { InferSelectModel, InferInsertModel, Relations, relations } from "drizzle-orm";
import { users, accounts, categories, transactions, attachments, budgets, savingGoals, exchangeRates, devices, syncLogs, settings } from "../db/schema";
// @/types/index.ts
// Base table types (select = existing record, insert = new record)
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type MiniUser = Pick<User, 'id' | 'name' | 'email'>;

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

export type Transaction = InferSelectModel<typeof transactions>;
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

