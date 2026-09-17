---
status: completed
created: 2026-09-17
brainstorm: ../reports/brainstorm-260917-0858-hide-demo-login-prod.md
blockedBy: []
blocks: []
---

# Plan: Hide demo-account login block from production

## Status

completed

## Summary

`/login` always renders a "Tài khoản demo (chưa nối backend)" block that prefills real login credentials (`lib/mock/mockUsers.ts`). Gate it behind an `isProductionEnv()` check so it shows during local `npm run dev` (any branch, including `dev`) and disappears from a production build (`npm run build && npm start`, i.e. `main` deploy) — with zero manual `.env` changes required, since `next dev` sets `NODE_ENV=development` and `next build` sets `NODE_ENV=production` automatically.

Full rationale, alternatives considered, and scout findings: [brainstorm report](../reports/brainstorm-260917-0858-hide-demo-login-prod.md).

## Phases

| Phase | Name | Status | Priority | Dependencies |
| ----- | ---- | ------ | -------- | ------------ |
| 1 | Extract isProductionEnv + gate demo block | completed | P2 | none |

See [phase-01-hide-demo-login.md](./phase-01-hide-demo-login.md).

## Dependencies

None — no other plan in `plans/` touches auth, login, or `utils/cookieConfig.ts`.

## Acceptance Criteria

- `npm run dev` (any branch) → demo-account block visible on `/login`.
- `npm run build && npm start` → demo-account block not rendered on `/login`.
- No change to Google login flow or real login submit behavior.
- `npx tsc --noEmit`, `npm run lint`, `npm test` all pass.

## Links

- Brainstorm report: [../reports/brainstorm-260917-0858-hide-demo-login-prod.md](../reports/brainstorm-260917-0858-hide-demo-login-prod.md)
