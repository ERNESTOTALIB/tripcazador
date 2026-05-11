# CLAUDE.md — TripCazador deploy + dev rules

> Read this BEFORE making any commit to this repo.

## 1. Deploy workflow — PRE first, PROD only on user signal

Effective **2026-05-11** after incident SSS143 (home down for hours due to a
Server Component bug shipped directly to `main`).

```
work → push `pre` branch → Vercel auto-deploys to preview URL → verify
in real browser → wait for user to say "deploy" → merge `pre` → `main`
```

**Rules — non-negotiable:**

1. **Default working branch is `pre`.** Before any commit, run
   `git checkout pre`. Never commit directly to `main`.
2. **Push to `pre`:** `git push origin pre`. Vercel will auto-build a
   preview deploy.
3. **Verify in real browser.** Open the Vercel preview URL (NOT curl,
   NOT tsc, NOT `next build` — those miss runtime RSC errors). Confirm:
   - No `"Algo salió mal"` text anywhere on key pages
   - Console has no `error.digest` exceptions
4. **PROD deploys = explicit user instruction only.** Wait for Ernesto
   to say "deploy a prod" / "deploy now". Then:
   ```bash
   git checkout main
   git merge pre --ff-only
   git push origin main
   git checkout pre  # return to working branch
   ```
5. **Time of day matters.** Ernesto prefers PROD deploys at "primera
   hora de la mañana" (first thing morning) so issues get caught early
   in the day. Don't push to main at night.

**Exceptions:** True hotfix only. If user says "esto es un hotfix
urgente, despliega ya", commit on main, push, then cherry-pick to pre.

## 2. Server Components ≠ event handlers

Next.js App Router. Server Components (files without `"use client"`)
**cannot** accept function props. Putting `onClick`, `onError`,
`onChange`, etc. on JSX inside a Server Component file generates the
error:

```
Error: An error occurred in the Server Components render.
digest: 1610473858 (or another deterministic hash)
```

The browser shows `error.tsx` ("Algo salió mal en el radar") even
though curl returns valid HTML (because the RSC stream contains both
the partial HTML AND the error flag).

**Before adding any `on*={...}` to JSX:**

1. Check if the file has `"use client"` on line 1.
2. If NO → either add `"use client"` to the file, or move the
   interactive subtree into a dedicated Client Component child.
3. If YES → fine, proceed.

**Real example that broke prod (HotelDealsStrip.tsx, commit 42b8205):**

```tsx
// ❌ BAD — Server Component with event handler
export function HotelDealsStrip() {
  return <img onError={(e) => e.currentTarget.style.display = "none"} />;
}

// ✅ GOOD — option A: make whole file a Client Component
"use client";
export function HotelDealsStrip() {
  return <img onError={(e) => ...} />;
}

// ✅ GOOD — option B: extract interactive bit
// HotelDealsStrip.tsx (server)
import { HotelImage } from "./HotelImage";
export function HotelDealsStrip() {
  return <HotelImage src={img} />;
}

// HotelImage.tsx (client)
"use client";
export function HotelImage({ src }: { src: string }) {
  return <img src={src} onError={(e) => ...} />;
}
```

## 3. Verifying after changes

`tsc --noEmit` and `next build` PASS even when this bug exists. They
do not exercise React runtime rendering. **Always verify in real
browser via the Vercel preview URL.**

Smoke checklist for `/` (home):
- Title in tab matches `TripCazador — Error fares y chollos de vuelo`
- No "Algo salió mal" anywhere in `document.body.innerText`
- DevTools console has no `error.digest` exceptions
- Hero shows "Vuelos imposibles al precio posible"
- Stats line "X chollos activos · motor en directo" visible

## 4. Branch protection rules

`main` should be configured in GitHub to:
- Require PR (no direct pushes by humans)
- Optionally: require status checks pass (CI smoke test on preview)

Worker bot commits (`chore(track): +5 events [skip ci]`) are exception —
they are automated and harmless. Hooked separately.

## 5. SW + Clear-Site-Data safety net

The repo has multiple layers that auto-heal users with stale cache:
- `public/sw.js` (SSS136): NO-OP kill switch, unregisters on activate
- `middleware.ts` (SSS139+140): Clear-Site-Data on first navigation +
  on `/sw.js` fetches, gated by `tc_heal_v1` cookie
- `src/app/error.tsx` (SSS137): self-heal on error boundary trigger
- `src/app/reset/route.ts` (SSS138): manual `/reset` endpoint

These exist for legacy users. Do not remove unless replacing with
equivalent.
