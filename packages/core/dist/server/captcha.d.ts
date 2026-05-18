export interface CaptchaVerifyResult {
    success: boolean;
    errorCodes?: string[];
}
/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * - If no secret key is provided (param or env), returns success (captcha is opt-in).
 * - In dev mode (NODE_ENV !== "production"), always returns success.
 */
export declare function verifyCaptcha(token: string, secretKey?: string): Promise<CaptchaVerifyResult>;
//# sourceMappingURL=captcha.d.ts.map