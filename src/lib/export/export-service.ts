import { Transaction, Category, TransactionMetadata } from "@/types";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";

// App branding from env
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || "Ajiya Ta";
const APP_EMAIL = process.env.EXPO_PUBLIC_APP_EMAIL || "";
const APP_PHONE = process.env.EXPO_PUBLIC_APP_PHONE || "";
const APP_ADDRESS = process.env.EXPO_PUBLIC_APP_ADDRESS || "";

export interface ExportOptions {
  format: "pdf" | "json" | "excel";
  transactions: Transaction[];
  period?: { start: Date; end: Date };
  accountName?: string;
  currency?: string;
  categories?: Category[];
}

function formatCurrency(amount: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "income":
      return "Revenu";
    case "expense":
      return "Dépense";
    case "transfer":
      return "Virement";
    default:
      return type;
  }
}

function computeTotals(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.type === "income") totalIncome += Number(tx.amount);
    else if (tx.type === "expense") totalExpense += Number(tx.amount);
  });
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

function buildAppHeader(): string {
  const parts = [APP_NAME];
  if (APP_EMAIL) parts.push(APP_EMAIL);
  if (APP_PHONE) parts.push(APP_PHONE);
  if (APP_ADDRESS) parts.push(APP_ADDRESS);
  return parts.join(" • ");
}

// ── PDF ──

async function generatePDF(options: ExportOptions): Promise<void> {
  const {
    transactions,
    period,
    accountName,
    currency = "XOF",
    categories = [],
  } = options;
  const totals = computeTotals(transactions);

  const safeAccount = (accountName ?? "Compte")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");

  const filename = `AjiyaTa_${safeAccount}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  const periodStr = period
    ? `Du ${formatDate(period.start)} au ${formatDate(period.end)}`
    : "Toutes les périodes";

  const rows = transactions
    .map((tx) => {
      const categoryName =
        categories.find((c) => c.id === tx.categoryId)?.name ||
        tx.categoryId ||
        "-";
      let metadataStr = "";
      // if ((tx.metadata as any)?.client) metadataStr = `<br><span style="font-size:10px;color:#666;">🏢 Client/Fournisseur : ${(tx.metadata as any).client}</span>`;
      // if ((tx.metadata as any)?.paidBy) metadataStr = `<br><span style="font-size:10px;color:#666;">👤 Payé par : ${(tx.metadata as any).paidBy}</span>`;

      const metadata = tx.metadata as TransactionMetadata | undefined;
      if (metadata?.client)
        metadataStr = `<br><span style="font-size:10px;color:#666;">🏢 Client/Fournisseur : ${metadata.client}</span>`;
      if (metadata?.paidBy)
        metadataStr = `<br><span style="font-size:10px;color:#666;">👤 Payé par : ${metadata.paidBy}</span>`;

      return `
      <tr>
        <td>${formatDate(tx.date)}</td>
        <td>${tx.title || "-"}${metadataStr}</td>
        <td>${getTypeLabel(tx.type)}</td>
        <td>${categoryName}</td>
        <td style="text-align:right;color:${tx.type === "expense" ? "#dc2626" : "#16a34a"}">${formatCurrency(Number(tx.amount), currency)}</td>
      </tr>
      `;
    })
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Helvetica Neue', sans-serif; padding: 20px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
          .header h1 { margin: 0; font-size: 22px; color: #16a34a; }
          .header p { margin: 4px 0; font-size: 11px; color: #666; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #444; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f0fdf4; color: #166534; padding: 8px; text-align: left; border-bottom: 2px solid #16a34a; }
          td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #fafafa; }
          .totals { margin-top: 20px; font-size: 13px; }
          .totals td { font-weight: bold; border: none; padding: 4px 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${APP_NAME}</h1>
          <p>${buildAppHeader()}</p>
        </div>
        <h2 style="font-size:16px;">Rapport des Transactions${accountName ? ` — ${accountName}` : ""}</h2>
        <p style="font-size:12px;color:#666;">${periodStr} • ${transactions.length} transaction(s)</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Catégorie</th>
              <th style="text-align:right">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <table class="totals">
          <tr><td>Total Revenus</td><td style="color:#16a34a">${formatCurrency(totals.totalIncome, currency)}</td></tr>
          <tr><td>Total Dépenses</td><td style="color:#dc2626">${formatCurrency(totals.totalExpense, currency)}</td></tr>
          <tr><td>Solde</td><td>${formatCurrency(totals.balance, currency)}</td></tr>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Le partage n'est pas disponible sur cet appareil.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Exporter le rapport PDF",
  });
}

// ── JSON ──

async function generateJSON(options: ExportOptions): Promise<void> {
  const { transactions, period, accountName, currency = "XOF" } = options;
  const totals = computeTotals(transactions);

  const safeAccount = (accountName ?? "Compte")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");

  const filename = `AjiyaTa_${safeAccount}_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  const exportObj = {
    app: {
      name: APP_NAME,
      email: APP_EMAIL,
      phone: APP_PHONE,
      address: APP_ADDRESS,
    },
    account: accountName || "N/A",
    period: period
      ? { start: period.start.toISOString(), end: period.end.toISOString() }
      : null,
    summary: {
      totalTransactions: transactions.length,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance: totals.balance,
      currency,
    },
    transactions: transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      title: tx.title,
      type: tx.type,
      amount: tx.amount,
      categoryId: tx.categoryId,
      note: tx.note,
      metadata: tx.metadata,
    })),
    exportedAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(exportObj, null, 2);
  const file = new File(Paths.document, filename);
  await file.write(jsonStr);
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Exporter les données JSON",
  });
}

// ── Excel ──

async function generateExcel(options: ExportOptions): Promise<void> {
  const {
    transactions,
    period,
    accountName,
    currency = "XOF",
    categories = [],
  } = options;
  const totals = computeTotals(transactions);

  const safeAccount = (accountName ?? "Compte")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");

  const filename = `AjiyaTa_${safeAccount}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  // Dynamic import to avoid bundling issues if xlsx is missing
  let XLSX: any;
  try {
    XLSX = require("xlsx");
  } catch {
    throw new Error(
      "Le module xlsx n'est pas installé. Installez-le avec: pnpm add xlsx",
    );
  }

  const wsData: any[][] = [];

  // App info header
  wsData.push([APP_NAME]);
  wsData.push([buildAppHeader()]);
  wsData.push([]);
  wsData.push([`Compte: ${accountName || "N/A"}`]);
  if (period) {
    wsData.push([
      `Période: ${formatDate(period.start)} - ${formatDate(period.end)}`,
    ]);
  }
  wsData.push([`Exporté le: ${formatDate(new Date())}`]);
  wsData.push([]);

  // Headers
  wsData.push(["Date", "Titre", "Type", "Catégorie", "Montant"]);

  // Data rows
  transactions.forEach((tx) => {
    const categoryName =
      categories.find((c) => c.id === tx.categoryId)?.name ||
      tx.categoryId ||
      "-";
    let metadataStr = "";
    if ((tx.metadata as any)?.client)
      metadataStr = ` (🏢 Client: ${(tx.metadata as any).client})`;
    if ((tx.metadata as any)?.paidBy)
      metadataStr = ` (👤 Payé par: ${(tx.metadata as any).paidBy})`;

    wsData.push([
      formatDate(tx.date),
      (tx.title || "-") + metadataStr,
      getTypeLabel(tx.type),
      categoryName,
      Number(tx.amount),
    ]);
  });

  // Totals
  wsData.push([]);
  wsData.push(["Total Revenus", "", "", "", totals.totalIncome]);
  wsData.push(["Total Dépenses", "", "", "", totals.totalExpense]);
  wsData.push(["Solde", "", "", "", totals.balance]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, // Date
    { wch: 30 }, // Titre
    { wch: 12 }, // Type
    { wch: 18 }, // Catégorie
    { wch: 15 }, // Montant
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const file = new File(Paths.document, filename);
  await file.write(wbout, { encoding: "base64" });
  await Sharing.shareAsync(file.uri, {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "Exporter les données Excel",
  });
}

// ── Main Export ──

export async function exportData(options: ExportOptions): Promise<void> {
  switch (options.format) {
    case "pdf":
      return generatePDF(options);
    case "json":
      return generateJSON(options);
    case "excel":
      return generateExcel(options);
    default:
      throw new Error(`Format non supporté: ${options.format}`);
  }
}
