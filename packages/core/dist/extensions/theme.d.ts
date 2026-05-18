/**
 * CSS variables baked into every extension iframe. Both light and dark are
 * always emitted — the `.dark` class on the iframe's `<html>` toggles between
 * them. This means a parent theme toggle becomes a single class toggle inside
 * the iframe (cheap, atomic, no full reload), and there is no race where the
 * iframe is briefly half-themed while postMessage values arrive.
 */
export declare function getThemeVars(_isDark?: boolean): string;
//# sourceMappingURL=theme.d.ts.map