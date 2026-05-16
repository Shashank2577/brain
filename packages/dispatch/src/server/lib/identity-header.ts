/**
 * Re-export the identity-header primitives from core. The canonical
 * implementation lives in core so both the caller (any worker) and the
 * verifier (dispatch) share one secret-binding implementation — and so
 * core has zero dependency on dispatch.
 */
export {
  signIdentity,
  verifyIdentity,
  IdentityHeaderError,
  IDENTITY_HEADER_NAME,
  type Identity,
  type SignOpts,
  type VerifyOpts,
} from "@agent-native/core/server";
