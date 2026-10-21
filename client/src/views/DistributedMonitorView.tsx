import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { ServiceHealthMetric } from '../types';
import {
  Activity,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Play,
  RotateCcw
} from 'lucide-react';

export const DistributedMonitorView: React.FC = () => {
  const [clusterData, setClusterData] = useState<{ clusterStatus: string; services: ServiceHealthMetric[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // RPC Demo state
  const [rpcMethod, setRpcMethod] = useState('analytics.pingService');
  const [rpcParams, setRpcParams] = useState('{"trainNumber": "12951"}');
  const [rpcResponse, setRpcResponse] = useState<any>(null);
  const [rpcLoading, setRpcLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const resp = await Api.getClusterHealth();
      if (resp.success && resp.data) {
        setClusterData(resp.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOutage = async (serviceId: string, currentFailed: boolean) => {
    setActionLoading(serviceId);
    try {
      await Api.simulateOutage(serviceId, !currentFailed);
      await fetchHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteRpc = async (e: React.FormEvent) => {
    e.preventDefault();
    setRpcLoading(true);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(rpcParams);
      } catch (e) {
        //
      }
      const resp = await Api.invokeRpc(rpcMethod, parsedParams);
      setRpcResponse(resp);
    } catch (err: any) {
      setRpcResponse({ error: err.message });
    } finally {
      setRpcLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              <span>DCS Distributed Services Monitor & Fault Recovery</span>
            </h1>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold text-[10px] border border-purple-800">
              DCS Mini Project
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real multi-process cluster architecture communicating via HTTP/JSON Inter-Process Communication (IPC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                clusterData?.clusterStatus === 'HEALTHY'
                  ? 'bg-emerald-400 animate-pulse'
                  : clusterData?.clusterStatus === 'DEGRADED'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            ></span>
            <span className="text-slate-200 font-semibold">Cluster: {clusterData?.clusterStatus || 'ONLINE'}</span>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs transition-all"
            title="Poll cluster health"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Polling...' : clusterData ? 'Refresh Health' : 'Load Cluster Health'}</span>
          </button>
        </div>
      </div>

      {!clusterData && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-2">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">Cluster Health Not Loaded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click <strong className="text-cyan-400">Load Cluster Health</strong> above to fetch live service node metrics and fault status.
          </p>
        </div>
      )}

      {/* Cluster Nodes Grid */}
      {clusterData && (
        <>
          <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Active Microservice Processes (Independent Ports)</span>
          </h2>
          <span className="text-xs text-slate-500">Auto-polled every 3s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(clusterData?.services || []).map(node => {
            const isGateway = node.serviceId === 'gateway';
            const isFailed = node.isSimulatedFailure || node.status === 'DEGRADED';
            const isDown = node.status === 'DOWN';

            return (
              <div
                key={node.serviceId}
                className={`p-5 rounded-2xl border transition-all ${
                  isFailed
                    ? 'bg-amber-950/20 border-amber-800/60 shadow-lg shadow-amber-950/20'
                    : isDown
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/85">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Port :{node.port}</span>
                    <h3 className="font-bold text-white text-sm mt-0.5">{node.name}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                      node.status === 'UP'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : node.status === 'DEGRADED'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 text-xs text-center border-b border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Uptime</span>
                    <span className="font-mono text-slate-300 font-semibold">{node.uptimeSeconds}s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Requests</span>
                    <span className="font-mono text-cyan-400 font-semibold">{node.requestCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Latency</span>
                    <span className="font-mono text-emerald-400 font-semibold">{Math.round(node.avgLatencyMs)}ms</span>
                  </div>
                </div>

                {/* Fault Injection Button */}
                {!isGateway ? (
                  <div className="pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Fault Injection</span>
                    <button
                      onClick={() => handleToggleOutage(node.serviceId, !!isFailed)}
                      disabled={actionLoading === node.serviceId}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isFailed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                          : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700'
                      }`}
                    >
                      {isFailed ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Service</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Simulate 503 Outage</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 text-[11px] text-slate-500 text-center">
                    API Gateway orchestrates routing and graceful degradation.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DCS Architectural Concept Mapping Demonstration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Distributed Fault Tolerance & Graceful Degradation in Action</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
            <span className="font-bold text-cyan-400 block mb-1">1. Partial Failure Isolation</span>
            When you trigger an outage on <code className="text-amber-300">train-intel</code> (Port 4001), only live train tracking degrades. The Journey Planner (Port 4002) and Reservation Service (Port 4003) remain completely operational!
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
            <span className="font-bold text-emerald-400 block mb-1">2. Downstream Timeout Handling</span>
            The Gateway enforces strict 4000ms AbortController deadlines so that a dead or stalled microservice never hangs user threads or crashes the entire cluster.
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850">
            <span className="font-bold text-purple-400 block mb-1">3. Immediate Self-Healing</span>
            Clicking "Restore Service" clears the fault flag, and within 3000ms the cluster heartbeats automatically recover to 100% HEALTHY without any process restart.
          </div>
        </div>
      </div>

      {/* DCS JSON-RPC 2.0 Procedure Invocation Demonstration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white">DCS JSON-RPC 2.0 Procedure Invocation Sandbox</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800">
            Protocol: JSON-RPC/2.0
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Demonstrates strict Remote Procedure Call (RPC) semantics (procedure name, structured params marshaling, correlation ID, error schema) vs REST resource endpoints.
        </p>

        <form onSubmit={handleExecuteRpc} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Remote Procedure Method
              </label>
              <select
                value={rpcMethod}
                onChange={e => setRpcMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="analytics.pingService">analytics.pingService</option>
                <option value="analytics.getTrendVelocity">analytics.getTrendVelocity</option>
                <option value="analytics.simulateDisruption">analytics.simulateDisruption</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Parameters (JSON Object)
              </label>
              <input
                type="text"
                value={rpcParams}
                onChange={e => setRpcParams(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={rpcLoading}
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-md shadow-purple-950 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{rpcLoading ? 'Invoking Remote Procedure...' : 'Invoke Remote Procedure (RPC)'}</span>
          </button>
        </form>

        {rpcResponse && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              RPC Response Payload
            </span>
            <pre className="text-cyan-300 overflow-x-auto">
              {JSON.stringify(rpcResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
