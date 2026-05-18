import { parseWorkspaceScope } from "./workspacify.js";
/**
 * Tagged error for input that fails CLI-level validation (repo names, app
 * names, etc.). The Sentry `beforeSend` hook in cli/index.ts drops events
 * whose top-level exception type is `ValidationError` so we don't pollute
 * Sentry with expected user-input rejections.
 */
export declare class ValidationError extends Error {
    constructor(message: string);
}
export interface CreateAppOptions {
    /** Pre-select these templates in the picker. Comma-separated string or array. */
    template?: string;
    /** Scaffold a single standalone app (old behavior). Skips workspace creation. */
    standalone?: boolean;
    /** Internal: skip pnpm install at the end (for tests). */
    noInstall?: boolean;
}
/**
 * Main entry for `agent-native create [name]`.
 *
 * Default behavior: scaffold a workspace at <name>/ with a multi-select
 * template picker. Use --standalone for the single-app standalone flow.
 *
 * If run *inside* an existing workspace, falls through to the add-app
 * flow that scaffolds one new app under apps/<name>/.
 */
export declare function createApp(name?: string, opts?: CreateAppOptions): Promise<void>;
declare function scaffoldWorkspaceRoot(targetDir: string, name: string): Promise<void>;
/**
 * Entry for `agent-native add-app [name]`. Called from inside a workspace.
 * Shows the multi-select picker (excluding already-installed apps) and
 * scaffolds each selected template under apps/<name>/.
 *
 * When `name` is provided with `--template foo`, scaffolds exactly one app
 * named <name> using template foo (non-interactive).
 */
export declare function addAppToWorkspace(name?: string, opts?: CreateAppOptions): Promise<void>;
/**
 * Scaffold a single app template into `targetDir`. Resolves:
 *   - "blank" → bundled default template
 *   - "github:user/repo" → download the whole repo
 *   - first-party template name → download that subdir from BuilderIO/agent-native
 */
declare function scaffoldAppTemplate(targetDir: string, template: string): Promise<void>;
/**
 * Scaffold internal workspace packages required by the selected templates.
 * Deduplicates so each package is only copied once even if multiple
 * templates need it.
 */
declare function scaffoldRequiredPackages(templateNames: string[], workspaceRoot: string): Promise<void>;
/**
 * Post-process a standalone scaffold: replace placeholders, strip
 * workspace:* deps, set up agent symlinks, etc.
 */
declare function postProcessStandalone(name: string, targetDir: string, templateName?: string): void;
/**
 * Walk up from startDir looking for a package.json with
 * `agent-native.workspaceCore` set. Returns the workspace root and core
 * package name, or null if not inside a workspace.
 */
export declare function detectWorkspace(startDir: string): {
    workspaceRoot: string;
    workspaceCoreName: string;
} | null;
export { parseWorkspaceScope };
/** @internal — exported for E2E tests */
export { scaffoldWorkspaceRoot as _scaffoldWorkspaceRoot, scaffoldAppTemplate as _scaffoldAppTemplate, scaffoldRequiredPackages as _scaffoldRequiredPackages, postProcessStandalone as _postProcessStandalone, loadCatalog as _loadCatalog, fixPackageJsonName as _fixPackageJsonName, renameGitignore as _renameGitignore, rewriteNetlifyToml as _rewriteNetlifyToml, getCoreDependencyVersion as _getCoreDependencyVersion, getGitHubTemplateRef as _getGitHubTemplateRef, getGitHubTemplateRefCandidates as _getGitHubTemplateRefCandidates, shouldSkipScaffoldEntry as _shouldSkipScaffoldEntry, tarExtractArgs as _tarExtractArgs, };
declare function tarExtractArgs(tarPath: string, destDir: string, options?: {
    skipAgentSymlinks?: boolean;
}): string[];
/**
 * Load the pnpm workspace catalog.
 * First tries the build-time snapshot at dist/catalog.json (works when
 * running as a published npm package). Falls back to parsing the monorepo
 * pnpm-workspace.yaml (works during local framework development).
 */
declare function loadCatalog(): Record<string, string>;
declare function fixPackageJsonName(appDir: string, name: string, templateName?: string): void;
declare function getCoreDependencyVersion(): string;
/**
 * Git refs to try, in priority order, when downloading templates from the
 * framework repo. The release tag scheme has shifted over time:
 *
 *   - ≤ 0.7.83: single repo-wide tag `v<version>` (legacy).
 *   - ≥ 0.8.0:  changesets per-package tags
 *               `@agent-native/core@<version>` (current).
 *
 * `main` is the final fallback so dev builds and brand-new releases (where
 * the tag has not propagated yet) still work — at the cost of pulling
 * potentially newer template code than the running CLI was built against.
 */
declare function getGitHubTemplateRefCandidates(): string[];
/** @deprecated Kept for backward-compatible test imports. Returns the
 *  highest-priority candidate; callers that need the full fallback list
 *  should use `getGitHubTemplateRefCandidates()`. */
declare function getGitHubTemplateRef(): string;
declare function rewriteNetlifyToml(appDir: string, appName: string, mode: "standalone" | "workspace"): void;
declare function renameGitignore(dir: string): void;
declare function shouldSkipScaffoldEntry(name: string, srcPath?: string): boolean;
//# sourceMappingURL=create.d.ts.map