---
name: code-review
description: Use when reviewing frontend changes (a diff, branch or PR) for correctness, role handling, error states and test gaps.
---

# Frontend review checklist

Run `git diff main...HEAD`, then check:

1. **Pattern**: pages fetch, components present; data via `useApiList`/`useMutation` on `utils/axios` (never raw `fetch`, which skips auth refresh); UI from `@/components/ui`.
2. **States**: loading, error, empty and success all handled (`QueryState`); mutation errors shown to the user; forms keep values on failure.
3. **Roles**: new route also in `src/roles.js`; endpoints it calls are on the backend role allow-list; UI hiding is not treated as security.
4. **Money and dates**: pence integers only; no float math on prices.
5. **Auth**: tokens only via `stores/authStore`; no tokens, operator codes or passwords in logs, URLs or tests; the shared single-flight refresh is untouched.
6. **Offline/POS**: `client_ref` reuse intact; only receipts queued offline; `isRejection` rule respected.
7. **Hygiene**: no new heavy dependency when a local primitive exists (MUI, redux, formik are unused); Prettier/ESLint clean (`npm run lint`); no `console.log`.
8. **Tests**: new behaviour covered; `npm test` and `npm run build` pass.

Report findings by severity with file:line and a concrete failure scenario.
