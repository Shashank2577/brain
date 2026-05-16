/**
 * Backward-compat re-export. The canonical implementation moved to
 * `@agent-native/core/server/mobile-token` so that `getSession()` in core
 * can verify the bearer JWT BEFORE the framework-global 401 guard fires
 * (see P0 #8 — mobile bearer JWT was rejected on all 13 templates because
 * the previous resolver, which lived in this package, ran too late).
 *
 * New code should import from `@agent-native/core/server`.
 */
export {
  signMobileToken,
  verifyMobileToken,
  extractBearerToken,
  type MobileTokenScope,
  type MobileTokenClaims,
  type DecodedMobileTokenPayload,
  type MobileTokenVerifyResult,
} from "@agent-native/core/server";
