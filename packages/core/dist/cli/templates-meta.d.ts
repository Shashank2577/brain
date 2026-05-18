/**
 * First-party template metadata used by the `agent-native` CLI.
 *
 * This file is intentionally inlined here (rather than imported from a
 * separate workspace package) so that the published `@agent-native/core`
 * has no `workspace:*` runtime dependencies. Without this inlining, `npx
 * @agent-native/core create ...` fails on a fresh machine with:
 *
 *   npm error code EUNSUPPORTEDPROTOCOL
 *   npm error Unsupported URL Type "workspace:": workspace:*
 *
 * Keep this list in sync with `packages/shared-app-config/templates.ts`,
 * which serves the same metadata to the desktop / mobile / frame packages
 * that always run inside the workspace. Duplication is intentional: the
 * CLI must remain installable outside the monorepo.
 */
export interface TemplateMeta {
    /** Directory name under templates/ and package name */
    name: string;
    /** Display name in pickers */
    label: string;
    /** One-line description shown in the picker */
    hint: string;
    /** Longer description (optional) */
    description?: string;
    /** Tabler icon name used in the desktop sidebar */
    icon: string;
    /** Hex accent color */
    color: string;
    /** CSS-safe RGB triplet (e.g. "59 130 246") */
    colorRgb: string;
    /** Dev server port for desktop `pnpm dev` */
    devPort: number;
    /** Production URL when running as a first-party app on agent-native.com */
    prodUrl?: string;
    /** Default URL path when deployed in a workspace (defaults to "/<name>") */
    prodPath?: string;
    /** Default mode when added to desktop app */
    defaultMode?: "dev" | "prod";
    /** Hide from pickers but still scaffoldable via explicit --template */
    hidden?: boolean;
    /** Include as a built-in connected A2A agent even when hidden from pickers */
    defaultAgent?: boolean;
    /** Always scaffold without prompting (e.g. starter as fallback) */
    alwaysAvailable?: boolean;
    /** Internal workspace packages this template depends on (e.g. "scheduling") */
    requiredPackages?: string[];
    /** Core app — featured in the CLI picker, homepage, and docs gallery */
    core?: boolean;
}
export declare const TEMPLATES: TemplateMeta[];
/** Return templates visible in user-facing pickers (excludes hidden). */
export declare function visibleTemplates(): TemplateMeta[];
/** Return core templates — the featured set shown in CLI pickers by default. */
export declare function coreTemplates(): TemplateMeta[];
/** Lookup by name. Returns undefined for unknown names. */
export declare function getTemplate(name: string): TemplateMeta | undefined;
/** Names of all templates (including hidden) for validation. */
export declare function allTemplateNames(): string[];
//# sourceMappingURL=templates-meta.d.ts.map