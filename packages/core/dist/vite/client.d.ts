import type { UserConfig } from "vite";
export interface NitroOptions {
    /** Nitro deployment preset (e.g. "node", "vercel", "netlify", "cloudflare_pages"). Default: "node" */
    preset?: string;
    /** Source directory for server files. Default: "./server" */
    srcDir?: string;
    /** Routes directory name (relative to srcDir). Default: "routes" */
    routesDir?: string;
    /** Any additional Nitro config overrides */
    [key: string]: unknown;
}
export interface ClientConfigOptions {
    /** Port for dev server. Default: 8080 */
    port?: number;
    /** Vite log level. Workspace child apps default to "warn" so only the gateway URL is advertised. */
    logLevel?: UserConfig["logLevel"];
    /** Additional Vite plugins */
    plugins?: any[];
    /** Nitro plugin options (preset, srcDir, etc) */
    nitro?: NitroOptions;
    /** Override resolve aliases */
    aliases?: Record<string, string>;
    /** Override build.outDir. Default: "dist/spa" */
    outDir?: string;
    /** Additional fs.allow paths */
    fsAllow?: string[];
    /** Additional fs.deny patterns */
    fsDeny?: string[];
    /** Additional Vite optimizeDeps configuration */
    optimizeDeps?: NonNullable<UserConfig["optimizeDeps"]>;
    /**
     * Whether to auto-inject the Tailwind v4 Vite plugin (`@tailwindcss/vite`).
     * Defaults to true — set to `false` if a template wants to manage Tailwind
     * itself (e.g. the legacy v3 PostCSS pipeline).
     */
    tailwind?: boolean;
    /**
     * Package names to stub in the SSR bundle with an empty proxy object.
     *
     * Use this for dependencies that only run in the browser (canvas / diagram
     * libraries, editors, WebGL) but would otherwise get pulled into the
     * server bundle via SSR's noExternal policy — pushing the CF Pages
     * Functions bundle over the 25 MiB limit.
     *
     * Only add packages that are provably never called during SSR. If the
     * server imports one, it will receive a Proxy that throws on any real
     * use (which is better than bundling a 10 MiB dep the worker never calls).
     *
     * @example
     * ssrStubs: ["mermaid", "@excalidraw/excalidraw"]
     */
    ssrStubs?: string[];
    /**
     * @deprecated Pass `reactRouter()` directly in the `plugins` array instead.
     * Previously used to auto-load the React Router Vite plugin via require(),
     * but this fails in ESM contexts. Templates should now do:
     * ```ts
     * import { reactRouter } from "@react-router/dev/vite";
     * defineConfig({ plugins: [reactRouter()] })
     * ```
     */
    reactRouter?: boolean | Record<string, unknown>;
}
export declare function stripMountedDevApiPath(reqUrl: string | undefined, base: string | undefined): string | undefined;
export declare function isFrameworkDevPath(reqUrl: string, base: string | undefined): boolean;
/**
 * Create the client Vite config with sensible agent-native defaults.
 * Supports two modes:
 * - Legacy SPA mode (default): React SWC plugin, client-only routing
 * - React Router framework mode: SSR-capable with file-based routing
 *
 * Both modes include Nitro for API routes, path aliases, and fs restrictions.
 */
export declare function defineConfig(options?: ClientConfigOptions): UserConfig;
//# sourceMappingURL=client.d.ts.map