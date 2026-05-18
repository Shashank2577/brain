/**
 * Shared design-token extraction utilities.
 *
 * Pure functions for parsing Tailwind configs, CSS files, package.json,
 * documents, and URLs to extract colors, fonts, spacing, border-radius,
 * and CSS custom properties. Used by the import-* actions across all
 * templates (design, slides, videos).
 *
 * No framework dependencies — no defineAction, no zod, no drizzle.
 */
/** Maximum number of files to fetch from a single GitHub repo. */
export declare const MAX_FILES = 10;
/** Maximum individual file size (100 KB). */
export declare const MAX_FILE_SIZE: number;
/** Timeout for GitHub API / URL fetch calls (ms). */
export declare const FETCH_TIMEOUT = 15000;
/** File-name patterns to look for at the repo root. */
export declare const ROOT_PATTERNS: RegExp[];
/** Secondary paths (files and directories) to check for design tokens. */
export declare const SECONDARY_PATHS: string[];
/** Maximum files accepted in import-code. */
export declare const CODE_MAX_FILES = 20;
/** Maximum total bytes accepted in import-code. */
export declare const CODE_MAX_TOTAL_BYTES: number;
/** Regex for hex colors (3-8 digit, including alpha). */
export declare const HEX_COLOR_RE: RegExp;
/** Regex for well-known named CSS colors. */
export declare const NAMED_COLOR_RE: RegExp;
/** Regex for well-known font family names found in documents. */
export declare const FONT_NAME_RE: RegExp;
/** Regex matching CSS custom property values that look like colors. */
export declare const COLOR_VAR_PATTERN: RegExp;
/** Well-known styling framework deps to detect in package.json. */
export declare const FRAMEWORK_DETECTORS: {
    name: string;
    label: string;
}[];
export type ContentType = "presentation" | "document" | "spreadsheet" | "pdf" | "other";
export interface ParsedCss {
    cssCustomProperties: Record<string, string> | undefined;
    fonts: string[] | undefined;
}
export interface ParsedTailwindConfig {
    colors?: Record<string, string>;
    fontFamily?: Record<string, string>;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
}
export interface CodeAnalysisState {
    colors: Record<string, string>;
    cssCustomProperties: Record<string, string>;
    fonts: {
        family: string;
        source?: string;
    }[];
    spacing: Record<string, string>;
    borderRadius: Record<string, string>;
    stylingFramework: string | null;
    rawExtracts: {
        filename: string;
        type: string;
        data: unknown;
    }[];
    seenFonts: Set<string>;
}
export interface UrlExtractionResult {
    url: string;
    pageTitle?: string;
    metaDescription?: string;
    themeColor?: string;
    cssCustomProperties?: Record<string, string>;
    colors?: string[];
    fontFaces?: {
        family?: string;
        src?: string;
    }[];
    googleFonts?: string[];
    ogImage?: string;
    favicon?: string;
}
export interface GitHubFetchOptions {
    token?: string | null;
}
export interface GitHubJsonResult<T = unknown> {
    ok: boolean;
    status: number;
    data: T | null;
    message?: string;
}
/** Validate a URL is safe to fetch (blocks localhost, private IPs, metadata endpoints). */
export declare function validateUrl(url: string): void;
/** Parse a GitHub URL or "org/repo" shorthand into owner + repo. */
export declare function parseOwnerRepo(raw: string): {
    owner: string;
    repo: string;
};
/** Fetch a path from the GitHub Contents API as JSON with status details. */
export declare function fetchGitHubJsonResult<T = unknown>(owner: string, repo: string, path: string, options?: GitHubFetchOptions): Promise<GitHubJsonResult<T>>;
/** Fetch a path from the GitHub Contents API as JSON. Returns null on error. */
export declare function fetchGitHubJson(owner: string, repo: string, path: string, options?: GitHubFetchOptions): Promise<unknown>;
/** Fetch raw file content from the GitHub Contents API. Returns null on error or oversize. */
export declare function fetchGitHubRaw(owner: string, repo: string, path: string, options?: GitHubFetchOptions): Promise<string | null>;
/** Extract colors, fonts, spacing, borderRadius from a Tailwind config file string. */
export declare function parseTailwindConfig(content: string): Record<string, unknown>;
/** Extract CSS custom properties and @font-face / Google Fonts from CSS content. */
export declare function parseCss(content: string): ParsedCss;
/** Detect the styling framework from a package.json string. */
export declare function detectStylingFramework(content: string): string | undefined;
/** Create a fresh state object for code file analysis. */
export declare function createCodeAnalysisState(): CodeAnalysisState;
/** De-duplicate and add a font to the analysis state. */
export declare function addFont(state: CodeAnalysisState, family: string, source?: string): void;
/** Extract CSS custom properties, classifying them by name into colors/spacing/radius. */
export declare function extractCssVars(state: CodeAnalysisState, content: string): void;
/** Extract literal color values (hex, rgb, hsl, oklch) from content. */
export declare function extractCodeColors(state: CodeAnalysisState, content: string): void;
/** Extract font-family declarations and @font-face blocks from CSS-like content. */
export declare function extractCodeFonts(state: CodeAnalysisState, content: string, filename: string): void;
/** Analyze a CSS/SCSS/LESS file, extracting vars, colors, and fonts. */
export declare function analyzeCssFile(state: CodeAnalysisState, content: string, filename: string): void;
/** Analyze a Tailwind config file for tokens. */
export declare function analyzeTailwindConfig(state: CodeAnalysisState, content: string, filename: string): void;
/** Walk a parsed JSON theme object, extracting tokens into state. */
export declare function analyzeJsonTheme(state: CodeAnalysisState, content: string, filename: string): void;
/** Analyze package.json for styling framework deps. */
export declare function analyzePackageJson(state: CodeAnalysisState, content: string, filename: string): void;
/** Analyze a theme source file (theme.ts, tokens.ts) for design tokens. */
export declare function analyzeThemeSourceFile(state: CodeAnalysisState, content: string, filename: string): void;
/** Route a file to the correct analyzer based on filename. */
export declare function analyzeCodeFile(state: CodeAnalysisState, filename: string, content: string): void;
/** Deduplicate and trim an array of strings. */
export declare function unique(arr: string[]): string[];
/** Extract hex and named colors from plain text. */
export declare function extractDocumentColors(text: string): string[];
/** Extract known font family names from plain text. */
export declare function extractDocumentFonts(text: string): string[];
/** Classify a file type string into a content category. */
export declare function classifyFile(fileType: string): ContentType;
/** Return per-type suggestions for how to use a document for design extraction. */
export declare function suggestionsForType(contentType: ContentType, hasText: boolean): string[];
/** Fetch and extract design tokens from a URL's HTML. */
export declare function extractDesignTokensFromUrl(rawUrl: string): Promise<UrlExtractionResult>;
//# sourceMappingURL=design-token-utils.d.ts.map