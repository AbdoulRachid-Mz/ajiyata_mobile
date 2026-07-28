/**
 * Formats a number as a currency string.
 * Default is XOF as per Ajiya Ta PRD.
 */
export const formatCurrency = (
  amount: number,
  currency: string = "XOF",
  locale: string = "fr-FR"
): string => {
  // Validate ISO 4217 currency code to prevent Hermes intl errors
  const validCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "XOF";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: validCurrency,
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
