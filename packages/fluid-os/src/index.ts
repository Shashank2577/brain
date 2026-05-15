export * from "./manifest/index.js";
export { CapabilityRegistry, type ResolvedCapability } from "./registry.js";
export { IdentityProvider, type OsSessionClaims } from "./identity/session.js";
export { createOsClient, RpcError, type OsClient, type OsClientOpts } from "./rpc/client.js";
export { createRpcHandler, type RpcHandler, type RpcHandlerOpts } from "./rpc/server.js";
export {
  RPC_PATH,
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  type RpcRequest,
  type RpcResponse,
  type RpcOk,
  type RpcErr,
} from "./rpc/protocol.js";
export { capabilitiesToAgentTools, type AgentTool } from "./agent/tools.js";
export { FluidOs, type FluidOsOpts } from "./host/index.js";
