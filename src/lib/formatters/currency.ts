/**
 * Formats a number as a currency string.
 * Default is XOF as per Ajiya Ta PRD.
 */
export const formatCurrency = (
  amount: number,
  currency: string = "XOF",
  locale: string = "fr-FR"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats an amount with a sign (e.g. + 1 000 XOF or - 500 XOF)
 */
export const formatAmountWithSign = (
  amount: number,
  type: "income" | "expense" | "transfer",
  currency: string = "XOF"
): string => {
  const formatted = formatCurrency(Math.abs(amount), currency);
  if (type === "income") return `+ ${formatted}`;
  if (type === "expense") return `- ${formatted}`;
  return formatted;
};
