export const RPC_PATH = "/_fluid-os/rpc";
export const LIST_APPS_PATH = "/_fluid-os/apps";
export const LIST_CAPABILITIES_PATH = "/_fluid-os/capabilities";

export interface RpcRequest {
  capability: string;
  input: unknown;
}

export interface RpcOk<T = unknown> {
  ok: true;
  output: T;
}

export interface RpcErr {
  ok: false;
  error: { code: string; message: string };
}

export type RpcResponse<T = unknown> = RpcOk<T> | RpcErr;
