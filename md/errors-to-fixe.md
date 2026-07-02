C:\Users\user\Desktop\abdoul\react projets\mobile\ajiya>npx tsc --noEmit
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
src/app/(tabs)/budgets.tsx:262:17 - error TS2322: Type '{ spent: number; account: { id: string; name: string; userId: string; type: "personal" | "business"; currency: string; }; id: string; metadata: unknown; status: "active" | "exceeded" | "completed"; version: number; ... 11 more ...; endDate: Date; }' is not assignable to type 'BudgetWithRelations'.
  Property 'category' is missing in type '{ spent: number; account: { id: string; name: string; userId: string; type: "personal" | "business"; currency: string; }; id: string; metadata: unknown; status: "active" | "exceeded" | "completed"; version: number; ... 11 more ...; endDate: Date; }' but required in type '{ account: MiniAccount; category: MiniCategory; }'.

262                 budget={{
                    ~~~~~~

  src/types/index.ts:88:3
    88   category: MiniCategory;
         ~~~~~~~~
    'category' is declared here.
  src/components/finance/budget-card.tsx:14:3
    14   budget: BudgetWithRelations;
         ~~~~~~
    The expected type comes from property 'budget' which is declared here on type 'IntrinsicAttributes & BudgetCardProps'


Found 1 error in src/app/(tabs)/budgets.tsx:262


C:\Users\user\Desktop\abdoul\react projets\mobile\ajiya>