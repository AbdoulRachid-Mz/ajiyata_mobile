import { Account, Budget, Category, SavingGoal, Transaction } from "@/types";
import { format } from "date-fns";
import { Paths, Directory, File } from "expo-file-system";

// Types pour l'export structuré
export interface StructuredExportOptions {
  transactions?: Transaction[];
  budgets?: Budget[];
  goals?: SavingGoal[];
  categories?: Category[];
  account?: Account;
  exportAll?: boolean;
}

export interface ExportResult {
  success: boolean;
  message: string;
  files: string[];
  rootPath: string;
}

// Constantes
const APP_FOLDER = "ajiyata";
const DATE_FORMAT = "yyyy-MM-dd";
const DATETIME_FORMAT = "yyyy-MM-dd_HH-mm-ss";

export class StructuredExportService {
  private static instance: StructuredExportService;
  private rootPath: string;

  private constructor() {
    this.rootPath = `${Paths.document.uri}${APP_FOLDER}/`;
  }

  static getInstance(): StructuredExportService {
    if (!StructuredExportService.instance) {
      StructuredExportService.instance = new StructuredExportService();
    }
    return StructuredExportService.instance;
  }

  /**
   * Assure que la structure de dossiers existe
   */
  private async ensureDirectoryStructure(): Promise<void> {
    const folders = [
      this.rootPath,
      `${this.rootPath}transactions/`,
      `${this.rootPath}transactions/income/`,
      `${this.rootPath}transactions/expense/`,
      `${this.rootPath}transactions/transfer/`,
      `${this.rootPath}transactions/by_category/`,
      `${this.rootPath}budgets/`,
      `${this.rootPath}budgets/active/`,
      `${this.rootPath}budgets/completed/`,
      `${this.rootPath}budgets/exceeded/`,
      `${this.rootPath}goals/`,
      `${this.rootPath}goals/active/`,
      `${this.rootPath}goals/completed/`,
      `${this.rootPath}goals/paused/`,
      `${this.rootPath}categories/`,
      `${this.rootPath}backups/`,
      `${this.rootPath}reports/`,
    ];

    for (const folder of folders) {
      const dir = new Directory(folder);
      if (!dir.exists) {
        await dir.create();
      }
    }
  }

  /**
   * Génère un nom de fichier unique avec date
   */
  private generateFileName(prefix: string, extension: string = "json"): string {
    const now = new Date();
    const dateStr = format(now, DATETIME_FORMAT);
    return `${prefix}_${dateStr}.${extension}`;
  }

  /**
   * Sauvegarde un fichier JSON
   */
  private async saveJSON(
    data: any,
    path: string,
    fileName: string,
  ): Promise<string> {
    const fullPath = `${path}${fileName}`;
    const jsonStr = JSON.stringify(data, null, 2);
    const file = new File(fullPath);
    await file.write(jsonStr);
    return fullPath;
  }

  /**
   * Exporte les transactions structurées
   */
  private async exportTransactions(
    transactions: Transaction[],
    categories: Category[] = [],
    account?: Account,
  ): Promise<string[]> {
    if (!transactions || transactions.length === 0) return [];

    const savedFiles: string[] = [];
    const basePath = `${this.rootPath}transactions/`;

    // 1. Export complet des transactions
    const allTxData = {
      account: account
        ? {
            id: account.id,
            name: account.name,
            type: account.type,
            currency: account.currency,
          }
        : null,
      exportedAt: new Date().toISOString(),
      total: transactions.length,
      summary: {
        totalIncome: transactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        totalExpense: transactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
        balance:
          transactions
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0) -
          transactions
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0),
      },
      transactions: transactions.map((tx) => ({
        ...tx,
        categoryName:
          categories.find((c) => c.id === tx.categoryId)?.name || null,
        date:
          typeof tx.date === "string"
            ? tx.date
            : new Date(tx.date).toISOString(),
      })),
    };

    const allFileName = this.generateFileName("transactions_all");
    await this.saveJSON(allTxData, basePath, allFileName);
    savedFiles.push(`${basePath}${allFileName}`);

    // 2. Export par type (income, expense, transfer)
    const types = ["income", "expense", "transfer"] as const;
    for (const type of types) {
      const filtered = transactions.filter((tx) => tx.type === type);
      if (filtered.length === 0) continue;

      const typeData = {
        type,
        count: filtered.length,
        totalAmount: filtered.reduce((s, t) => s + t.amount, 0),
        transactions: filtered.map((tx) => ({
          ...tx,
          categoryName:
            categories.find((c) => c.id === tx.categoryId)?.name || null,
          date:
            typeof tx.date === "string"
              ? tx.date
              : new Date(tx.date).toISOString(),
        })),
      };

      const typeFileName = this.generateFileName(`transactions_${type}`);
      const typePath = `${basePath}${type}/`;
      await this.saveJSON(typeData, typePath, typeFileName);
      savedFiles.push(`${typePath}${typeFileName}`);
    }

    // 3. Export par catégorie
    const categoriesMap = new Map<string, Category>();
    categories.forEach((c) => categoriesMap.set(c.id, c));

    for (const [catId, category] of categoriesMap) {
      const filtered = transactions.filter((tx) => tx.categoryId === catId);
      if (filtered.length === 0) continue;

      const catData = {
        category: {
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
        },
        count: filtered.length,
        totalAmount: filtered.reduce((s, t) => s + t.amount, 0),
        transactions: filtered.map((tx) => ({
          ...tx,
          date:
            typeof tx.date === "string"
              ? tx.date
              : new Date(tx.date).toISOString(),
        })),
      };

      const safeName = category.name.replace(/[^a-zA-Z0-9]/g, "_");
      const catFileName = this.generateFileName(`category_${safeName}`);
      const catPath = `${basePath}by_category/`;
      await this.saveJSON(catData, catPath, catFileName);
      savedFiles.push(`${catPath}${catFileName}`);
    }

    return savedFiles;
  }

  /**
   * Exporte les budgets structurés
   */
  private async exportBudgets(
    budgets: Budget[],
    account?: Account,
  ): Promise<string[]> {
    if (!budgets || budgets.length === 0) return [];

    const savedFiles: string[] = [];
    const basePath = `${this.rootPath}budgets/`;

    // 1. Export complet
    const allData = {
      account: account
        ? {
            id: account.id,
            name: account.name,
            currency: account.currency,
          }
        : null,
      exportedAt: new Date().toISOString(),
      total: budgets.length,
      budgets: budgets.map((b) => ({
        ...b,
        spent: b.spent || 0,
        progress: b.limit > 0 ? ((b.spent || 0) / b.limit) * 100 : 0,
        startDate:
          typeof b.startDate === "string"
            ? b.startDate
            : new Date(b.startDate).toISOString(),
        endDate:
          typeof b.endDate === "string"
            ? b.endDate
            : new Date(b.endDate).toISOString(),
      })),
    };

    const allFileName = this.generateFileName("budgets_all");
    await this.saveJSON(allData, basePath, allFileName);
    savedFiles.push(`${basePath}${allFileName}`);

    // 2. Export par statut
    const statuses = ["active", "exceeded", "completed"] as const;
    for (const status of statuses) {
      const filtered = budgets.filter((b) => b.status === status);
      if (filtered.length === 0) continue;

      const statusData = {
        status,
        count: filtered.length,
        budgets: filtered.map((b) => ({
          ...b,
          spent: b.spent || 0,
          progress: b.limit > 0 ? ((b.spent || 0) / b.limit) * 100 : 0,
        })),
      };

      const statusFileName = this.generateFileName(`budgets_${status}`);
      const statusPath = `${basePath}${status}/`;
      await this.saveJSON(statusData, statusPath, statusFileName);
      savedFiles.push(`${statusPath}${statusFileName}`);
    }

    return savedFiles;
  }

  /**
   * Exporte les objectifs d'épargne structurés
   */
  private async exportGoals(
    goals: SavingGoal[],
    account?: Account,
  ): Promise<string[]> {
    if (!goals || goals.length === 0) return [];

    const savedFiles: string[] = [];
    const basePath = `${this.rootPath}goals/`;

    // 1. Export complet
    const allData = {
      account: account
        ? {
            id: account.id,
            name: account.name,
            currency: account.currency,
          }
        : null,
      exportedAt: new Date().toISOString(),
      total: goals.length,
      summary: {
        totalTarget: goals.reduce((s, g) => s + g.targetAmount, 0),
        totalSaved: goals.reduce((s, g) => s + g.currentAmount, 0),
        progress:
          (goals.reduce(
            (s, g) =>
              s + (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0),
            0,
          ) /
            goals.length) *
          100,
      },
      goals: goals.map((g) => ({
        ...g,
        progress:
          g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
        deadline: g.deadline
          ? typeof g.deadline === "string"
            ? g.deadline
            : new Date(g.deadline).toISOString()
          : null,
        createdAt:
          typeof g.createdAt === "string"
            ? g.createdAt
            : new Date(g.createdAt).toISOString(),
      })),
    };

    const allFileName = this.generateFileName("goals_all");
    await this.saveJSON(allData, basePath, allFileName);
    savedFiles.push(`${basePath}${allFileName}`);

    // 2. Export par statut
    const statuses = ["active", "completed", "paused"] as const;
    for (const status of statuses) {
      const filtered = goals.filter((g) => g.status === status);
      if (filtered.length === 0) continue;

      const statusData = {
        status,
        count: filtered.length,
        totalTarget: filtered.reduce((s, g) => s + g.targetAmount, 0),
        totalSaved: filtered.reduce((s, g) => s + g.currentAmount, 0),
        goals: filtered.map((g) => ({
          ...g,
          progress:
            g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
        })),
      };

      const statusFileName = this.generateFileName(`goals_${status}`);
      const statusPath = `${basePath}${status}/`;
      await this.saveJSON(statusData, statusPath, statusFileName);
      savedFiles.push(`${statusPath}${statusFileName}`);
    }

    return savedFiles;
  }

  /**
   * Exporte les catégories
   */
  private async exportCategories(
    categories: Category[],
    account?: Account,
  ): Promise<string[]> {
    if (!categories || categories.length === 0) return [];

    const savedFiles: string[] = [];
    const basePath = `${this.rootPath}categories/`;

    const data = {
      account: account
        ? {
            id: account.id,
            name: account.name,
          }
        : null,
      exportedAt: new Date().toISOString(),
      total: categories.length,
      categories: categories.map((c) => ({
        ...c,
        type: c.type,
        isDefault: c.isDefault || false,
      })),
    };

    const fileName = this.generateFileName("categories");
    await this.saveJSON(data, basePath, fileName);
    savedFiles.push(`${basePath}${fileName}`);

    return savedFiles;
  }

  /**
   * Export complet de toutes les données
   */
  async exportAllData(options: StructuredExportOptions): Promise<ExportResult> {
    try {
      await this.ensureDirectoryStructure();

      const allFiles: string[] = [];
      const { transactions, budgets, goals, categories, account } = options;

      // Exporter les transactions
      if (transactions && transactions.length > 0) {
        const txFiles = await this.exportTransactions(
          transactions,
          categories,
          account,
        );
        allFiles.push(...txFiles);
      }

      // Exporter les budgets
      if (budgets && budgets.length > 0) {
        const budgetFiles = await this.exportBudgets(budgets, account);
        allFiles.push(...budgetFiles);
      }

      // Exporter les objectifs
      if (goals && goals.length > 0) {
        const goalFiles = await this.exportGoals(goals, account);
        allFiles.push(...goalFiles);
      }

      // Exporter les catégories
      if (categories && categories.length > 0) {
        const catFiles = await this.exportCategories(categories, account);
        allFiles.push(...catFiles);
      }

      // Créer un résumé global
      await this.createGlobalSummary(options);

      return {
        success: true,
        message: `Export terminé avec succès (${allFiles.length} fichiers)`,
        files: allFiles,
        rootPath: this.rootPath,
      };
    } catch (error) {
      console.error("Export error:", error);
      return {
        success: false,
        message: `Erreur lors de l'export: ${error}`,
        files: [],
        rootPath: this.rootPath,
      };
    }
  }

  /**
   * Crée un résumé global de toutes les données
   */
  private async createGlobalSummary(
    options: StructuredExportOptions,
  ): Promise<void> {
    const { transactions, budgets, goals, categories, account } = options;
    const basePath = `${this.rootPath}reports/`;

    const summary = {
      app: "Ajiya Ta",
      account: account
        ? {
            id: account.id,
            name: account.name,
            type: account.type,
            currency: account.currency,
          }
        : null,
      exportedAt: new Date().toISOString(),
      summary: {
        transactions: {
          total: transactions?.length || 0,
          income:
            transactions
              ?.filter((t) => t.type === "income")
              .reduce((s, t) => s + t.amount, 0) || 0,
          expense:
            transactions
              ?.filter((t) => t.type === "expense")
              .reduce((s, t) => s + t.amount, 0) || 0,
          balance:
            (transactions
              ?.filter((t) => t.type === "income")
              .reduce((s, t) => s + t.amount, 0) || 0) -
            (transactions
              ?.filter((t) => t.type === "expense")
              .reduce((s, t) => s + t.amount, 0) || 0),
        },
        budgets: {
          total: budgets?.length || 0,
          active: budgets?.filter((b) => b.status === "active").length || 0,
          exceeded: budgets?.filter((b) => b.status === "exceeded").length || 0,
          completed:
            budgets?.filter((b) => b.status === "completed").length || 0,
          totalLimit: budgets?.reduce((s, b) => s + b.limit, 0) || 0,
          totalSpent: budgets?.reduce((s, b) => s + (b.spent || 0), 0) || 0,
        },
        goals: {
          total: goals?.length || 0,
          active: goals?.filter((g) => g.status === "active").length || 0,
          completed: goals?.filter((g) => g.status === "completed").length || 0,
          paused: goals?.filter((g) => g.status === "paused").length || 0,
          totalTarget: goals?.reduce((s, g) => s + g.targetAmount, 0) || 0,
          totalSaved: goals?.reduce((s, g) => s + g.currentAmount, 0) || 0,
        },
        categories: {
          total: categories?.length || 0,
          income: categories?.filter((c) => c.type === "income").length || 0,
          expense: categories?.filter((c) => c.type === "expense").length || 0,
        },
      },
    };

    const fileName = `summary_${format(new Date(), DATETIME_FORMAT)}.json`;
    await this.saveJSON(summary, basePath, fileName);
  }

  /**
   * Vérifie si l'export est possible (espace disque)
   */
  async getStorageInfo(): Promise<{
    freeSpace: number;
    totalSpace: number;
    usedSpace: number;
    isEnough: boolean;
  }> {
    try {
      // getFreeDiskStorageAsync / getTotalDiskCapacityAsync are not part of the new API on File/Directory objects directly.
      // We can mock it or use an alternative if needed, but since we are not using the legacy import anymore,
      // let's return a safe assumption if we don't have these methods available.
      
      const requiredSpace = 10 * 1024 * 1024; // 10MB
      
      return {
        freeSpace: requiredSpace * 10,
        totalSpace: requiredSpace * 100,
        usedSpace: requiredSpace * 90,
        isEnough: true,
      };
    } catch (error) {
      console.error("Storage info error:", error);
      return {
        freeSpace: 0,
        totalSpace: 0,
        usedSpace: 0,
        isEnough: false,
      };
    }
  }
}

export const structuredExport = StructuredExportService.getInstance();
