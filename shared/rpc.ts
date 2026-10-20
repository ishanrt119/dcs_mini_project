// Distributed Computing Systems - Explicit JSON-RPC 2.0 Module
// Demonstrates RPC semantics (Procedure Invocation, Marshaling, ID tracking) vs REST resource semantics.

import { DCS_RpcRequest, DCS_RpcResponse } from './types.js';

export async function invokeRpc(serviceUrl: string, method: string, params: any): Promise<any> {
  const rpcPayload: DCS_RpcRequest = {
    jsonrpc: '2.0',
    id: `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    method,
    params
  };

  const response = await fetch(`${serviceUrl}/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DCS-Protocol': 'JSON-RPC/2.0'
    },
    body: JSON.stringify(rpcPayload)
  });

  if (!response.ok) {
    throw new Error(`RPC transport failure: HTTP ${response.status} from ${serviceUrl}`);
  }

  const rpcResponse: DCS_RpcResponse = await response.json();
  if (rpcResponse.error) {
    throw new Error(`RPC Procedure Error [${rpcResponse.error.code}]: ${rpcResponse.error.message}`);
  }

  return rpcResponse.result;
}

export type RpcHandler = (params: any) => Promise<any> | any;

export class RpcServer {
  private handlers: Map<string, RpcHandler> = new Map();

  public register(method: string, handler: RpcHandler) {
    this.handlers.set(method, handler);
  }

  public async handle(req: DCS_RpcRequest): Promise<DCS_RpcResponse> {
    if (req.jsonrpc !== '2.0' || !req.method) {
      return {
        jsonrpc: '2.0',
        id: req.id || null as any,
        error: { code: -32600, message: 'Invalid JSON-RPC 2.0 Request' }
      };
    }

    const handler = this.handlers.get(req.method);
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method '${req.method}' not found on remote node` }
      };
    }

    try {
      const result = await handler(req.params);
      return {
        jsonrpc: '2.0',
        id: req.id,
        result
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32000, message: err.message || 'Internal RPC error' }
      };
    }
  }
}
