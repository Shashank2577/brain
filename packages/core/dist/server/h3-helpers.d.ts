import type { H3Event } from "h3";
import type { ReadStream } from "node:fs";
/**
 * Parse a JSON request body. Returns `{}` if the body is empty or absent
 * so callers don't have to null-check before destructuring.
 *
 * Defaults T to `any` for ergonomic field access. Pass an explicit type
 * argument when you want a typed result:
 *
 *   const { email, password } = await readBody<LoginRequest>(event);
 */
export declare function readBody<T = any>(event: H3Event): Promise<T>;
/**
 * Convert a Node `ReadStream` (e.g. from `fs.createReadStream`) into a web
 * `ReadableStream`, suitable for returning directly from an h3 v2 handler.
 *
 *   import { streamFile } from "@agent-native/core/server";
 *   import fs from "node:fs";
 *
 *   return streamFile(fs.createReadStream(filePath));
 */
export declare function streamFile(stream: ReadStream): ReadableStream;
//# sourceMappingURL=h3-helpers.d.ts.map