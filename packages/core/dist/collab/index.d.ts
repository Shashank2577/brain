export { loadYDocState, saveYDocState, hasCollabState, deleteCollabState, uint8ArrayToBase64, base64ToUint8Array, } from "./storage.js";
export { getDoc, applyUpdate, applyText, getText, getState, getIncUpdate, seedFromText, releaseDoc, searchAndReplace, applyJson, applyPatchOps, getJson, seedFromJson, } from "./ydoc-manager.js";
export { searchAndReplaceInYXml, extractTextFromYXml } from "./xml-ops.js";
export { applyTextToYDoc, initYDocWithText } from "./text-to-yjs.js";
export { getCollabEmitter, emitCollabUpdate, type CollabEvent, } from "./emitter.js";
export { getCollabState, postCollabUpdate, postCollabText, postCollabSearchReplace, } from "./routes.js";
export { seedYDocFromJson, yMapToJson, yArrayToJson, yDocToJson, applyJsonDiff, applyJsonPatch, initYDocWithJson, type PatchOp, } from "./json-to-yjs.js";
export { postCollabJson, getCollabJson, postCollabPatch, } from "./struct-routes.js";
export { AGENT_CLIENT_ID, DEFAULT_AGENT_IDENTITY, type AgentIdentity, } from "./agent-identity.js";
export { agentEnterDocument, agentLeaveDocument, agentUpdateSelection, agentApplyEditsIncrementally, agentApplyPatchesIncrementally, } from "./agent-presence.js";
export { getDocAwareness, type AwarenessEntry } from "./awareness.js";
//# sourceMappingURL=index.d.ts.map