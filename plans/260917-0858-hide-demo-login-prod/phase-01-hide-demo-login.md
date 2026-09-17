---
phase: 1
title: "Extract isProductionEnv + gate demo block"
status: completed
priority: P2
effort: "30m"
dependencies: []
---

# Phase 1: Extract isProductionEnv + gate demo block

## Overview

Add a shared `isProductionEnv()` helper (reusing the existing `NODE_ENV`/`NEXT_PUBLIC_ENV` check already duplicated in `utils/cookieConfig.ts`), refactor `cookieConfig.ts` to use it, and wrap the demo-account UI block in `login-form.tsx` with it.

## Requirements

- Functional: demo-account block renders only when `!isProductionEnv()`.
- Non-functional: no new env var to configure; behavior driven purely by `NODE_ENV` (auto-set by `next dev` / `next build`), matching how `dev` branch is used (local-only, per user confirmation).

## Architecture

```
lib/utils/env.ts          <- new: isProductionEnv()
utils/cookieConfig.ts     <- refactor: use isProductionEnv() instead of inline duplication (2 call sites)
app/(auth)/login/login-form.tsx <- gate demo block render with isProductionEnv()
```

No change to `lib/mock/mockUsers.ts` (import stays static/unconditional — decided in brainstorm: hiding UI is sufficient, no dynamic-import bundle-splitting needed for 4 fake demo accounts).

## Related Code Files

- Create: `lib/utils/env.ts`
- Modify: `utils/cookieConfig.ts`
- Modify: `app/(auth)/login/login-form.tsx`

## Implementation Steps

1. Create `lib/utils/env.ts`:
   ```ts
   export function isProductionEnv(): boolean {
     return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENV === "production";
   }
   ```
2. In `utils/cookieConfig.ts`, replace both inline `isProduction` computations (`getCookieDomain` and `getSecureCookieConfig`, currently duplicating the same expression) with `const isProduction = isProductionEnv();`, importing from `@/lib/utils/env`.
3. In `app/(auth)/login/login-form.tsx`:
   - Import `isProductionEnv` from `@/lib/utils/env`.
   - Wrap the existing demo-account block (the `<div className="space-y-2 border-t border-border pt-4">...</div>` containing "Tài khoản demo (chưa nối backend)", currently lines ~158-180) in `{!isProductionEnv() && ( ... )}`.
   - Leave `DEMO_ACCOUNTS` derivation and the `MOCK_ACCOUNTS` import as-is (static, unconditional per brainstorm decision).
4. Manually verify: `npm run dev` shows the block; `npm run build && npm start` (or inspect that `isProductionEnv()` returns `true` when `NODE_ENV=production`) hides it.

## Success Criteria

- [x] `lib/utils/env.ts` created and exports `isProductionEnv()`.
- [x] `utils/cookieConfig.ts` uses `isProductionEnv()`, no behavior change (same `isProduction` semantics as before — verified: pure mechanical substitution, code-reviewer confirmed identical precedence/short-circuit).
- [x] Demo-account block in `login-form.tsx` only renders when `!isProductionEnv()`.
- [x] `npm run dev` locally → demo block visible (verified: curled rendered HTML, "Tài khoản demo" present — 1 match).
- [x] `npm run build && npm start` → demo block absent (verified: curled rendered HTML, "Tài khoản demo" absent — 0 matches).
- [x] `npx tsc --noEmit` passes (2 pre-existing unrelated `.next/` stale-cache errors resolved by clearing `.next/`; clean `npm run build` succeeds).
- [x] `npm run lint` passes.
- [x] `npm test` passes (7/7, no existing tests cover `login-form.tsx` or `cookieConfig.ts`).

## Follow-ups (out of this phase's scope)

- Confirm the 4 seeded demo accounts (`student1@gmail.com`, `lecturer@gmail.com`, `manager@gmail.com`, `admin@gmail.com`) do not exist — or don't share the demo password — in the production backend DB. The UI gate hides the shortcut buttons; it does not revoke backend credentials. Tracked by the existing `// TODO: xoá file này khi có API đăng nhập thật` in `lib/mock/mockUsers.ts`.

## Risk Assessment

- Low risk: purely additive helper + one conditional render + a mechanical refactor of an existing duplicated expression. No behavior change to cookie config (same `isProduction` value, same two boolean sources, same precedence/order).
- Rollback: revert the three file changes; no data/schema/API impact.
