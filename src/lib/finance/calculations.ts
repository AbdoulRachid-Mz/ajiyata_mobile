import { Transaction } from "@/types";

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

/**
 * Calculates financial summary from a list of transactions.
 * Note: Balance is also a derived value in Ajiya Ta's philosophy.
 */
export const calculateFinancialSummary = (transactions: Transaction[], initialBalance: number = 0): FinancialSummary => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
    }
    // Transfer logic could be added here if it affects account-specific balance
  });

  const totalBalance = initialBalance + totalIncome - totalExpense;
  const profit = totalIncome - totalExpense; // In this simple model, profit = balance

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    profit,
  };
};

/**
 * Filters transactions by date range.
 */
export const filterTransactionsByDate = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });
};

/**
 * Gets transactions for the current month.
 */
export const getCurrentMonthTransactions = (transactions: Transaction[]): Transaction[] => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return filterTransactionsByDate(transactions, startOfMonth, endOfMonth);
};
