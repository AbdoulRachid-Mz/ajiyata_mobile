import { z } from "zod";

/**
 * Common validation schemas reused across the app features.
 * This avoids duplicating logic while keeping the database schema pure.
 */

export const amountSchema = z
  .string()
  .transform((val) => parseFloat(val))
  .refine((val) => !isNaN(val) && val > 0, {
    message: "Le montant doit être un nombre positif",
  });

export const titleSchema = z.string().min(2, "Trop court").max(50, "Trop long");

export const transactionFormSchema = z.object({
  title: titleSchema,
  amount: amountSchema,
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.string().uuid("Catégorie invalide").optional().nullable(),
  note: z.string().max(200, "La note est trop longue").optional().nullable(),
  date: z.date().default(() => new Date()),
});

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export const budgetFormSchema = z.object({
  categoryId: z.string().uuid("Catégorie requise"),
  limit: amountSchema,
  period: z.enum(["daily", "weekly", "monthly"]),
});

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFormData = z.infer<typeof budgetFormSchema>;

export const savingGoalFormSchema = z.object({
  title: titleSchema,
  targetAmount: amountSchema,
  deadline: z.date().optional().nullable(),
});

export type SavingGoalFormInput = z.input<typeof savingGoalFormSchema>;
export type SavingGoalFormData = z.infer<typeof savingGoalFormSchema>;
