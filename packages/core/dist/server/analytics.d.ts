/**
 * Opt-in analytics injection for SSR streams.
 * Supported environment variables:
 * - `GA_MEASUREMENT_ID` — Google Analytics 4 measurement ID
 *
 * Amplitude and Sentry are initialized client-side via their npm packages
 * (see `packages/core/src/client/analytics.ts`). Only GA requires script
 * tag injection because the gtag.js loader must be a `<script src>`.
 *
 * When set, the corresponding script tags are injected before `</head>`.
 * When not set, the stream passes through untouched (zero overhead).
 *
 * Usage in entry.server.tsx:
 * ```ts
 * import { wrapWithAnalytics } from "@agent-native/core/server";
 * return new Response(wrapWithAnalytics(body), { ... });
 * ```
 */
export declare function wrapWithAnalytics(body: ReadableStream): ReadableStream;
//# sourceMappingURL=analytics.d.ts.map