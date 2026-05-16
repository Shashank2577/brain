---
"@agent-native/core": patch
"@agent-native/dispatch": patch
---

Make `build` scripts hermetic by removing `dist/` before tsc. Previously, running `pnpm build` twice in a row (e.g. via `pnpm install` postinstall followed by `pnpm dev:lazy` prebuild) tripped TS5055 because tsc resolved package-exports paths into the populated `dist/` and saw its own outputs as inputs. Cross-platform via `node -e`'s `fs.rmSync`.
