import type { AuthSession } from "../server/auth.js";
export type { AuthSession };
interface UseSessionResult {
    session: AuthSession | null;
    isLoading: boolean;
}
/**
 * Client-side hook to get the current auth session.
 *
 * - In dev mode: immediately returns { email: "local@localhost" }
 * - In production: fetches /_agent-native/auth/session and returns the result
 *
 * Templates should use this instead of building their own auth context.
 */
export declare function useSession(): UseSessionResult;
//# sourceMappingURL=use-session.d.ts.map