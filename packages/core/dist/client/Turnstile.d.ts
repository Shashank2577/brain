export interface TurnstileProps {
    /** Turnstile site key. Falls back to VITE_TURNSTILE_SITE_KEY env var. */
    siteKey?: string;
    /** Called with the verification token when Turnstile completes. */
    onVerify: (token: string) => void;
    /** Called when the token expires. */
    onExpire?: () => void;
    /**
     * Turnstile appearance mode:
     * - "managed" (default): invisible unless a challenge is needed
     * - "invisible": fully invisible, never shows UI
     */
    mode?: "managed" | "invisible";
    /** Additional className for the container div. */
    className?: string;
}
declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        __turnstileOnLoad?: () => void;
    }
}
/**
 * Cloudflare Turnstile captcha widget.
 *
 * Renders nothing if no site key is available (graceful opt-in).
 * In "managed" mode (default), the widget is invisible unless
 * Turnstile determines a challenge is needed.
 */
export declare function Turnstile({ siteKey, onVerify, onExpire, mode, className, }: TurnstileProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Turnstile.d.ts.map