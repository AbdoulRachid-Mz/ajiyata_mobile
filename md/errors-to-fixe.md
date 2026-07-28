C:\Users\user\Desktop\abdoul\react projets\mobile\ajiya>npx tsc --noEmit
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
src/app/currency-converter.tsx:356:14 - error TS2304: Cannot find name 'TextInput'.

356             <TextInput
                 ~~~~~~~~~

src/components/finance/transaction-item.tsx:253:38 - error TS2339: Property 'client' does not exist on type '{}'.

253               {transaction.metadata?.client && (
                                         ~~~~~~

src/components/finance/transaction-item.tsx:255:65 - error TS2339: Property 'client' does not exist on type '{}'.

255                   🏢 Client/Fournisseur : {transaction.metadata.client}
                                                                    ~~~~~~

src/components/finance/transaction-item.tsx:258:38 - error TS2339: Property 'paidBy' does not exist on type '{}'.

258               {transaction.metadata?.paidBy && (
                                         ~~~~~~

src/components/finance/transaction-item.tsx:260:55 - error TS2339: Property 'paidBy' does not exist on type '{}'.

260                   👤 Payé par : {transaction.metadata.paidBy}
                                                          ~~~~~~

src/lib/export/export-service.ts:85:24 - error TS2339: Property 'client' does not exist on type '{}'.

85       if (tx.metadata?.client) metadataStr = `<br><span style="font-size:10px;color:#666;">🏢 Client/Fournisseur : ${tx.metadata.client}</span>`;
                          ~~~~~~

src/lib/export/export-service.ts:85:130 - error TS2339: Property 'client' does not exist on type '{}'.

85       if (tx.metadata?.client) metadataStr = `<br><span style="font-size:10px;color:#666;">🏢 Client/Fournisseur : ${tx.metadata.client}</span>`;
                                                                                                                                    ~~~~~~

src/lib/export/export-service.ts:86:24 - error TS2339: Property 'paidBy' does not exist on type '{}'.

86       if (tx.metadata?.paidBy) metadataStr = `<br><span style="font-size:10px;color:#666;">👤 Payé par : ${tx.metadata.paidBy}</span>`;
                          ~~~~~~

src/lib/export/export-service.ts:86:120 - error TS2339: Property 'paidBy' does not exist on type '{}'.

86       if (tx.metadata?.paidBy) metadataStr = `<br><span style="font-size:10px;color:#666;">👤 Payé par : ${tx.metadata.paidBy}</span>`;
                                                                                                                          ~~~~~~

src/lib/export/export-service.ts:252:22 - error TS2339: Property 'client' does not exist on type '{}'.

252     if (tx.metadata?.client) metadataStr = ` (🏢 Client: ${tx.metadata.client})`;
                         ~~~~~~

src/lib/export/export-service.ts:252:72 - error TS2339: Property 'client' does not exist on type '{}'.

252     if (tx.metadata?.client) metadataStr = ` (🏢 Client: ${tx.metadata.client})`;
                                                                           ~~~~~~

src/lib/export/export-service.ts:253:22 - error TS2339: Property 'paidBy' does not exist on type '{}'.

253     if (tx.metadata?.paidBy) metadataStr = ` (👤 Payé par: ${tx.metadata.paidBy})`;
                         ~~~~~~

src/lib/export/export-service.ts:253:74 - error TS2339: Property 'paidBy' does not exist on type '{}'.

253     if (tx.metadata?.paidBy) metadataStr = ` (👤 Payé par: ${tx.metadata.paidBy})`;
                                                                             ~~~~~~

src/lib/validation/index.ts:24:15 - error TS2554: Expected 2-3 arguments, but got 1.

24   metadata: z.record(z.any()).optional().nullable(),
                 ~~~~~~

  node_modules/zod/v4/classic/schemas.d.cts:534:107
    534 export declare function record<Key extends core.$ZodRecordKey, Value extends core.SomeType>(keyType: Key, valueType: Value, params?: string | core.$ZodRecordParams): ZodRecord<Key, Value>;
                                                                                                                  ~~~~~~~~~~~~~~~~
    An argument for 'valueType' was not provided.

src/services/sync/SyncService.ts:251:47 - error TS2339: Property 'isDefault' does not exist on type '{ name: string; email: string | null; phoneNumber: string; role: "user" | "admin"; country: string | null; language: string | null; defaultCurrency: string; accountType: "personal" | "business" | "family"; ... 9 more ...; metadata: unknown; } | ... 6 more ... | { ...; }'.
  Property 'isDefault' does not exist on type '{ name: string; email: string | null; phoneNumber: string; role: "user" | "admin"; country: string | null; language: string | null; defaultCurrency: string; accountType: "personal" | "business" | "family"; ... 9 more ...; metadata: unknown; }'.

251           if (entity === "categories" && item.isDefault) {
                                                  ~~~~~~~~~


Found 15 errors in 5 files.

Errors  Files
     1  src/app/currency-converter.tsx:356
     4  src/components/finance/transaction-item.tsx:253
     8  src/lib/export/export-service.ts:85
     1  src/lib/validation/index.ts:24
     1  src/services/sync/SyncService.ts:251

C:\Users\user\Desktop\abdoul\react projets\mobile\ajiya>