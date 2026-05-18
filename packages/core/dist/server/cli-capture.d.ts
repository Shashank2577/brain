/** Sentinel thrown when an action calls `process.exit(...)`. */
export declare class ExitIntercepted extends Error {
    code: number;
    constructor(code: number);
}
export interface CaptureCliOptions {
    /**
     * If `true` (default), errors thrown by `fn` (other than
     * `ExitIntercepted`) are appended to the capture buffer as `"Error: ..."`
     * and the resolved logs are returned. If `false`, errors propagate.
     */
    swallowErrors?: boolean;
}
/**
 * Run `fn` with a fresh capture buffer. All console.log / console.error /
 * process.stdout.write calls inside `fn` (including async descendants)
 * append to the buffer instead of going to the server's stdout/stderr.
 * Returns the joined logs (or `"(no output)"` if nothing was captured).
 *
 * `process.exit(code)` inside `fn` throws `ExitIntercepted` internally; it
 * is caught here so the captured output (including any final logs the
 * action wrote before exiting) is preserved.
 */
export declare function captureCliOutput(fn: () => Promise<unknown>, options?: CaptureCliOptions): Promise<string>;
/**
 * Append a string to the active capture buffer. No-op outside of a
 * `captureCliOutput` scope — used by callers that catch errors from
 * `fn` themselves and want to emit the message into the captured logs.
 */
export declare function appendCapturedLog(text: string): void;
//# sourceMappingURL=cli-capture.d.ts.map