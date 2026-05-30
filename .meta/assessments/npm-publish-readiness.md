# Assessment: npm Publish Readiness

Date: 2026-05-30
Branch: feature/npm-publish

## Current State

Package: `chipper@0.1.0`, MIT license, ES module only.

**Build chain**: `tsc -p tsconfig.build.json && vite build && npm run build:css`
- TypeScript type-check (tsconfig.build.json)
- Vite library mode (3 entry points: index, headless, themes/index)
- Sass compilation (5 CSS files: styles, base, praxis, midnight, terminal)
- `prepublishOnly` hook runs the full build

**Package contents** (from `npm pack --dry-run`): 12 files, 31.2 kB tarball:
- `dist/index.js` (46.9 kB), `dist/headless.js` (455 B), `dist/themes/index.js` (7.8 kB)
- `dist/usePopup-Of6OHa1_.js` (17.7 kB) — Vite code-split chunk
- 5 CSS files (styles.css, base.css, praxis/midnight/terminal themes)
- README.md (23.1 kB), LICENSE (1.1 kB), package.json

**Exports map**: correctly configured for `chipper`, `chipper/headless`,
`chipper/themes`, `chipper/styles.css`, individual theme CSS files.

**Tests**: 289 passing, zero src/ type errors.

**README**: comprehensive — quick start, core concepts, domain types,
sentence building, theming, headless mode, full API reference.

## What's Working

- Build chain produces correct JS bundles (Vite library mode)
- CSS compiles and ships via package exports
- React 18/19 peer deps correctly declared
- `files` field correctly limits package to `dist/`, `README.md`, `LICENSE`
- No test artifacts leak into the tarball (verified via `npm pack --dry-run`)
- prepublishOnly hook ensures clean builds
- 3 entry points (main, headless, themes) all correctly mapped
- Keywords, repository, license, description all present

## Gaps

### Blocker: No type declarations (.d.ts) ship

`tsconfig.build.json` sets `"noEmit": true`, so `tsc -p tsconfig.build.json`
only type-checks — it doesn't emit `.d.ts` files. The base `tsconfig.json`
has `"declaration": true` and `"declarationMap": true`, but those are
overridden by the build config.

The `npm pack` output confirms: zero `.d.ts` files in the tarball.
Consumers get no TypeScript types. This is the #1 blocker.

**Fix**: Change tsconfig.build.json to emit declarations:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "emitDeclarationOnly": true
  },
  "exclude": ["tests", "demo"]
}
```
This emits `.d.ts` and `.d.ts.map` files without re-emitting JS (Vite
handles JS). Verify the `types` fields in package.json exports resolve
correctly after this change.

### Demo page cleanup

- `demo/src/App1.tsx`, `App2.tsx`, `App3.tsx` — old iterations that
  should be deleted. App3.tsx is untracked; App1/App2 are tracked.
- Footer says "v0.2 · chipper" — should say v1.0 or match package.json.
- The demo is a dev playground, not the public showcase (that's
  philbas.com now). It should be clean and minimal.

### Package metadata

- `homepage` field missing — should point to philbas.com/chipper or
  the GitHub repo.
- `"version": "0.1.0"` — should this be 1.0.0 for the initial publish?
  Pre-v1 means no stability guarantees, but the library is feature-
  complete per the roadmap. Decision needed.

### Vite chunk naming

`dist/usePopup-Of6OHa1_.js` — the hash in the filename is Vite's
default chunk splitting. This works but the name is opaque. Consumers
importing `chipper` get this chunk auto-loaded, so it's not a DX issue,
but it's slightly ugly in node_modules. Minor.

### Source maps

No source maps ship (Vite's library mode doesn't emit them by default
for external consumers). This is fine — source maps in npm packages
are a nice-to-have, not a requirement.

## External Input

- Design decision (2026-05-30): demo page moves to philbas.com.
  chipper/demo/ stays as a minimal dev playground.
- Roadmap: npm publish is the sole pre-release gate.

## Recommended Next Steps

1. **Fix declaration emission** — change tsconfig.build.json to
   `emitDeclarationOnly: true`, verify .d.ts files appear in dist/
   and resolve correctly from exports map.
2. **Clean up demo** — delete App1/2/3.tsx, update footer version.
3. **Decide version number** — 0.1.0 (pre-stable) or 1.0.0 (stable)?
4. **Add homepage field** to package.json.
5. **Test the full consumer workflow** — `npm pack`, install in a
   scratch project, verify imports, types, CSS, and themes all work.
6. **Publish** — `npm publish` (or `--dry-run` first).
