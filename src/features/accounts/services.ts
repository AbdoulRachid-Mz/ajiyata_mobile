import { db } from "@/db";
import { accounts, categories, users } from "@/db/schema";
import { getCategoriesForAccountType } from "@/features/categories/constants";
import type {
  Account,
  Category,
  NewAccount,
  NewCategory,
  NewUser,
  User,
} from "@/types";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import i18n from "@/configs/i18n";

export type InitializeAccountResult = {
  user: User;
  account: Account;
  categories: Category[];
};

export async function initializeAccount(
  userName: string,
  accountName: string,
  phoneNumber: string,
  accountType: "personal" | "business" | "family",
  currency: string,
  initialBalance: number = 0,
): Promise<InitializeAccountResult> {
  const userId = generateUUID();
  const accountId = generateUUID();
  const deviceId = "temp-device-id";
  const now = getCurrentTimestamp();

  // Utiliser la fonction de traduction i18n
  const t = i18n.t.bind(i18n);

  console.log('Initializing account for:', userName, 'Account:', accountName, 'Initial balance:', initialBalance);

  try {
    // Create user data
    const userData: NewUser = {
      id: userId,
      name: userName,
      phoneNumber: phoneNumber,
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
    const accountResult = await db
      .insert(accounts)
      .values(accountData)
      .returning();
    const insertedAccount = accountResult[0];

    if (!insertedAccount) throw new Error("Failed to insert account");

    // Create default categories with translations
    const defaultCategories = getCategoriesForAccountType(accountType, t);
    
    console.log('Creating categories...');
    const newCategories: NewCategory[] = defaultCategories.map((cat) => ({
      id: generateUUID(),
      accountId: accountId,
      name: cat.name, // Déjà traduit par getCategoriesForAccountType
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
      deviceId,
      version: 1,
      syncStatus: "pending",
      metadata: {},
    }));

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
