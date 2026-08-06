# @parrot/web Agent & Developer Guide

This document outlines the architectural conventions, coding rules, component design patterns, and state management guidelines enforced across the `@parrot/web` Next.js frontend application.

---

## 1. Architecture & Folder Structure

### Page Routes (`apps/web/app/**/page.tsx`)
- **Rule**: Page files in `app/` are lightweight route adapters only.
- **Do NOT** place complex inline JSX layouts, state management, or queries directly inside `page.tsx`.
- **Pattern**: Every route must delegate immediately to a dedicated top-level entry component inside `@/components/`:
  - `app/page.tsx` $\rightarrow$ `<LandingPage />` (`@/components/landing`)
  - `app/(dashboard)/dashboard/page.tsx` $\rightarrow$ `<DashboardOverviewPage />` (`@/components/dashboard/overview`)
  - `app/(dashboard)/dashboard/settings/page.tsx` $\rightarrow$ `<SettingsContent />` (`@/components/dashboard/settings`)
  - `app/(dashboard)/dashboard/automations/page.tsx` $\rightarrow$ `<AutomationsPage />` (`@/components/dashboard/automations`)
  - `app/(dashboard)/dashboard/contacts/page.tsx` $\rightarrow$ `<ContactsPage />` (`@/components/dashboard/contacts`)

### UI Components Division
- **`components/ui/` (Shadcn UI Primitives)**:
  - Contains strictly generated Shadcn UI primitive components (`button.tsx`, `input.tsx`, `table.tsx`, `skeleton.tsx`, etc.).
  - **NEVER edit primitive styles in `components/ui/*`** to fix feature-level styling issues. Another developer installing or updating Shadcn CLI components will overwrite `components/ui/*`.
- **`components/parrot-ui/` (Custom Project UI Primitives)**:
  - Houses custom project-wide UI abstractions (such as `<DataTable />`) that are protected from Shadcn CLI overwrites.
  - Re-exported via `components/parrot-ui/index.ts`.

---

## 2. Form Handling & Validation

- **Form Framework**: Always use **React Hook Form** (`useForm`) combined with **Zod** (`zodResolver`).
- **Schema Location**: All form validation schemas must be defined in `apps/web/lib/schema.ts` (e.g. `CannedResponseFormSchema`, `GeneralSettingsSchema`, `loginSchema`, `createWorkspaceSchema`).
- **Error Handling Pattern**:
  Always use `ErrorHandler` and `notify.error` for API mutation error responses:
  ```typescript
  onError: (err: unknown) => {
    const formattedError = ErrorHandler(err);
    notify.error(err, formattedError);
  }
  ```

---

## 3. Table Architecture (TanStack Table)

- **Reusable Data Table**: All tabular data views use the generic `<DataTable columns={columns} data={data} />` wrapper from `@/components/parrot-ui/data-table`.
- **Column Definition Files**: Keep column definitions in separate feature-specific column files (e.g. `canned-response-columns.tsx`).
- **TypeScript Signature**: Use `ColumnDef<any, TData>[]` for column definitions to maintain clean compatibility across TanStack Table versions.

---

## 4. State & Query Management

- **Centralized Settings Hooks**: React Query queries and mutations for settings are centralized in `apps/web/hooks/use-settings.ts` and re-exported via `apps/web/hooks/index.ts`.
- **Hooks Available**:
  - `useBusinessHours(propertyId)` & `useUpdateBusinessHours()`
  - `useCannedResponses()` & `useCreateCannedResponse()`, `useUpdateCannedResponse()`, `useDeleteCannedResponse()`
  - `useUpdateProperty()`

---

## 5. Design System & Aesthetics

- **Color Palette & Accents**: Use clean neutral tones (`neutral-900`, `neutral-500`, dark-mode `dark:bg-[#191919]`) and standard accent badges (`emerald-*`, `blue-*`).
- **Focus Rings**: Avoid default browser outline rings or hardcoded blue border overrides on feature components. Standardize focus ring styling on application inputs.
- **Skeleton Loaders**: Use `<Skeleton />` from `@/components/ui/skeleton` for query loading states instead of raw spinner text or generic loaders.

---

## 6. Constants & Navigation

- **Navigation & Constants File**: Store shared navigation items, route paths, and application limits in `apps/web/lib/constants.ts`.
- **Settings Tabs**: Re-use `SETTINGS_NAV_ITEMS` from `apps/web/lib/constants.ts` across `<SettingsNav />` and `generateMetadata` in `page.tsx`.

---

## 7. TypeScript Guidelines

- **Strict No `any` Rule**: Do not use `any` types in project feature files.
- Use strict DTOs from `@parrot/sdk`, local TypeScript interfaces, or `unknown` with type narrowing.
