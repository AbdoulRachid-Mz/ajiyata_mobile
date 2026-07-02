import { db } from "@/db";
import { accounts, categories, users } from "@/db/schema";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/features/categories/constants";
import type {
  Account,
  Category,
  NewAccount,
  NewCategory,
  NewUser,
  User,
} from "@/types";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";

export type InitializeAccountResult = {
  user: User;
  account: Account;
  categories: Category[];
};

export async function initializeAccount(
  userName: string,
  accountName: string,
  accountType: "personal" | "business",
  currency: string,
  initialBalance: number = 0,
): Promise<InitializeAccountResult> {
  const userId = generateUUID();
  const accountId = generateUUID();
  const deviceId = "temp-device-id";
  const now = getCurrentTimestamp();

  console.log('Initializing account for:', userName, 'Account:', accountName, 'Initial balance:', initialBalance);

  try {
    // Create user data
    const userData: NewUser = {
      id: userId,
      name: userName,
      phoneNumber: "0000000000",
      defaultCurrency: currency,
      accountType: accountType,
      createdAt: now,
      updatedAt: now,
      deviceId,
      version: 1,
      syncStatus: "pending",
      metadata: {},
      role: "user",
      isSynced: false,
    };

    // Insert user and get back the inserted record
    const userResult = await db.insert(users).values(userData).returning();
    const insertedUser = userResult[0];

    if (!insertedUser) throw new Error("Failed to insert user");

    // Create account data
    const accountData: NewAccount = {
      id: accountId,
      userId: userId,
      name: accountName,
      type: accountType,
      currency,
      initialBalance,
      balance: initialBalance,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deviceId,
      version: 1,
      syncStatus: "pending",
      metadata: {},
    };

    console.log('Inserting account...');
    // Insert account and get back the inserted record
    const accountResult = await db
      .insert(accounts)
      .values(accountData)
      .returning();
    const insertedAccount = accountResult[0];

    if (!insertedAccount) throw new Error("Failed to insert account");

    // Create default categories
    const allDefaultCategories = [
      ...DEFAULT_INCOME_CATEGORIES,
      ...DEFAULT_EXPENSE_CATEGORIES,
    ];

    console.log('Creating categories...');
    const newCategories: NewCategory[] = allDefaultCategories.map((cat) => ({
      id: generateUUID(),
      accountId: accountId,
      ...cat,
      createdAt: now,
      updatedAt: now,
      deviceId,
      version: 1,
      syncStatus: "pending",
      metadata: {},
    }));

    // Insert categories and get back the inserted records
    const insertedCategories = await db
      .insert(categories)
      .values(newCategories)
      .returning();

    console.log('Initialization complete.');

    return {
      user: insertedUser,
      account: insertedAccount,
      categories: insertedCategories,
    };
  } catch (error) {
    console.error('CRITICAL: Error in initializeAccount:', error);
    throw error;
  }
}
