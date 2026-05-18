import type { FileUploadProvider } from "./types.js";
/**
 * Built-in Builder.io file upload provider.
 * Uses the same BUILDER_PRIVATE_KEY as the browser/background-agent flows,
 * so connecting Builder once (via the sidebar "Connect Builder" action)
 * automatically enables file uploads.
 *
 * Upload API: https://www.builder.io/c/docs/upload-api
 */
export declare const builderFileUploadProvider: FileUploadProvider;
//# sourceMappingURL=builder.d.ts.map