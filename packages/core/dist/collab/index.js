// Public API for @agent-native/core/collab
// Storage
export { loadYDocState, saveYDocState, hasCollabState, deleteCollabState, uint8ArrayToBase64, base64ToUint8Array, } from "./storage.js";
// YDoc manager
export { getDoc, applyUpdate, applyText, getText, getState, getIncUpdate, seedFromText, releaseDoc, searchAndReplace, applyJson, applyPatchOps, getJson, seedFromJson, } from "./ydoc-manager.js";
// XmlFragment operations
export { searchAndReplaceInYXml, extractTextFromYXml } from "./xml-ops.js";
// Text-to-Yjs bridge
export { applyTextToYDoc, initYDocWithText } from "./text-to-yjs.js";
// Emitter
export { getCollabEmitter, emitCollabUpdate, } from "./emitter.js";
// Route handlers
export { getCollabState, postCollabUpdate, postCollabText, postCollabSearchReplace, } from "./routes.js";
// JSON-to-Yjs bridge (structured data)
export { seedYDocFromJson, yMapToJson, yArrayToJson, yDocToJson, applyJsonDiff, applyJsonPatch, initYDocWithJson, } from "./json-to-yjs.js";
// Structured data route handlers
export { postCollabJson, getCollabJson, postCollabPatch, } from "./struct-routes.js";
// Agent identity
export { AGENT_CLIENT_ID, DEFAULT_AGENT_IDENTITY, } from "./agent-identity.js";
// Agent presence lifecycle
export { agentEnterDocument, agentLeaveDocument, agentUpdateSelection, agentApplyEditsIncrementally, agentApplyPatchesIncrementally, } from "./agent-presence.js";
// Awareness (re-export for agent-presence consumers)
export { getDocAwareness } from "./awareness.js";
//# sourceMappingURL=index.js.map