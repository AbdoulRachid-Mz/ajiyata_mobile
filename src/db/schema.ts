import {
  relations
} from "drizzle-orm";
import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Shared sync columns base for all tables (sync-first design requirement)
const baseSyncColumns = {
  id: text("id").primaryKey(), // UUID
  createdAt: int("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: int("deleted_at", { mode: "timestamp" }),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "failed"] })
    .notNull()
    .default("pending"),
  lastSyncedAt: int("last_synced_at", { mode: "timestamp" }),
  deviceId: text("device_id").notNull(),
  version: int("version").notNull().default(1),
  metadata: text("metadata", { mode: "json" }).notNull().default("{}"),
};

// Users table - core system user
export const users = sqliteTable("users", {
  ...baseSyncColumns,
  name: text("name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number").notNull(),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  country: text("country"),
  language: text("language"),
  defaultCurrency: text("default_currency").notNull(),
  accountType: text("account_type", {
    enum: ["personal", "business"],
  }).notNull(),
  isSynced: int("is_synced", { mode: "boolean" }).notNull().default(false),
});

// Auth Sessions table - local tracking of active sessions
export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(), // UUID
  firebaseUid: text("firebase_uid"), // Optionnel si session locale pure
  provider: text("provider", { enum: ["email", "google", "apple", "anonymous", "local"] }).notNull(),
  deviceId: text("device_id").notNull(),
  isLocal: int("is_local", { mode: "boolean" }).notNull().default(true),
  isSynced: int("is_synced", { mode: "boolean" }).notNull().default(false),
  biometricEnabled: int("biometric_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(),
  lastLogin: int("last_login", { mode: "timestamp" }).notNull(),
  lastSync: int("last_sync", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }).notNull().default("{}"),
});

// Accounts table - multi-account core (personal/business separation)
export const accounts = sqliteTable("accounts", {
  ...baseSyncColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["personal", "business"] }).notNull(),
  currency: text("currency").notNull(),
  initialBalance: real("initial_balance").notNull().default(0), // Initial balance set by user during onboarding
  balance: real("balance").notNull().default(0), // Derived value: initialBalance + (sum of income - sum of expenses)
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
});

// Categories table - transaction categorization
export const categories = sqliteTable("categories", {
  ...baseSyncColumns,
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  isDefault: int("is_default", { mode: "boolean" }).notNull().default(false),
});

// Transactions table - core financial records
export const transactions = sqliteTable("transactions", {
  ...baseSyncColumns,
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  note: text("note"),
  date: int("date", { mode: "timestamp" }).notNull(),
  isSynced: int("is_synced", { mode: "boolean" }).notNull().default(false),
});

// Attachments table - receipt/document storage (upload integration)
export const attachments = sqliteTable("attachments", {
  ...baseSyncColumns,
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  transactionId: text("transaction_id").references(() => transactions.id),
  type: text("type", { enum: ["image", "receipt", "document"] }).notNull(),
  localUri: text("local_uri").notNull(),
  uploadUrl: text("upload_url"),
  uploadId: text("upload_id"),
  size: int("size"),
  isSynced: int("is_synced", { mode: "boolean" }).notNull().default(false),
});

// Budgets table - spending tracking per category
export const budgets = sqliteTable("budgets", {
  ...baseSyncColumns,
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  limit: real("limit").notNull(),
  spent: real("spent").notNull().default(0), // Derived value from transactions
  period: text("period", { enum: ["daily", "weekly", "monthly"] }).notNull(),
  startDate: int("start_date", { mode: "timestamp" }).notNull(),
  endDate: int("end_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["active", "exceeded", "completed"] })
    .notNull()
    .default("active"),
});

// Saving goals table - savings tracking
export const savingGoals = sqliteTable("saving_goals", {
  ...baseSyncColumns,
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  title: text("title").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  deadline: int("deadline", { mode: "timestamp" }),
  status: text("status", { enum: ["active", "completed", "paused"] })
    .notNull()
    .default("active"),
});
// Exchange rates table - multi-currency support
export const exchangeRates = sqliteTable("exchange_rates", {
  ...baseSyncColumns,
  baseCurrency: text("base_currency").notNull(),
  targetCurrency: text("target_currency").notNull(),
  rate: real("rate").notNull(),
});

// Devices table - multi-device sync tracking
export const devices = sqliteTable("devices", {
  ...baseSyncColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  platform: text("platform", { enum: ["android", "ios"] }).notNull(),
  lastActiveAt: int("last_active_at", { mode: "timestamp" }).notNull(),
});

// Sync logs table - sync operation audit
export const syncLogs = sqliteTable("sync_logs", {
  ...baseSyncColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  deviceId: text("device_id")
    .notNull()
    .references(() => devices.id),
  action: text("action", { enum: ["create", "update", "delete"] }).notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  status: text("status", { enum: ["pending", "synced", "failed"] })
    .notNull()
    .default("pending"),
});

// Settings table - user preferences
export const settings = sqliteTable("settings", {
  ...baseSyncColumns,
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("system"),
  language: text("language").notNull(),
  currency: text("currency").notNull(),
  biometricEnabled: int("biometric_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  syncEnabled: int("sync_enabled", { mode: "boolean" }).notNull().default(true),
});

// Drizzle relations schema definition (used for querying)
export const relationsSchema = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  devices: many(devices),
  syncLogs: many(syncLogs),
  settings: one(settings, {
    fields: [users.id],
    references: [settings.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  categories: many(categories),
  transactions: many(transactions),
  attachments: many(attachments),
  budgets: many(budgets),
  savingGoals: many(savingGoals),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  account: one(accounts, {
    fields: [categories.accountId],
    references: [accounts.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [transactions.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [transactions.categoryId],
      references: [categories.id],
    }),
    attachments: many(attachments),
  }),
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  account: one(accounts, {
    fields: [attachments.accountId],
    references: [accounts.id],
  }),
  transaction: one(transactions, {
    fields: [attachments.transactionId],
    references: [transactions.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  account: one(accounts, {
    fields: [budgets.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const savingGoalsRelations = relations(savingGoals, ({ one }) => ({
  account: one(accounts, {
    fields: [savingGoals.accountId],
    references: [accounts.id],
  }),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
  syncLogs: many(syncLogs),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  user: one(users, {
    fields: [syncLogs.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [syncLogs.deviceId],
    references: [devices.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  // Optionnel: on pourrait lier à users si firebaseUid == users.id, mais c'est découplé pour le moment.
}));
