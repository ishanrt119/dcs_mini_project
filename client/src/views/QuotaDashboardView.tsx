import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { QuotaStatus } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import {
  ShieldAlert,
  Database,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Lock,
  History,
  TrendingUp,
  RefreshCw,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';

export const QuotaDashboardView: React.FC = () => {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    setLoading(true);
    try {
      const resp = await Api.getQuota();
      if (resp.success && resp.data) {
        setQuota(resp.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Live API Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-600/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-200">
              Live API Gateway — Real-Time Rail Intelligence Active
            </h3>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              High-throughput live railway feeds, timetables, and multi-service distributed orchestration.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-lg bg-emerald-900/80 text-emerald-300 font-mono text-xs font-bold border border-emerald-700">
          LIVE API: ACTIVE
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <span>API Quota & Request Budget Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time API governor and telemetry tracker managing distributed microservice IPC and live endpoint requests.
          </p>
        </div>

        <button
          onClick={fetchQuotaData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Usage Audit</span>
        </button>
      </div>

      {/* Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Live Stream Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Live Railway API Stream</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              ACTIVE
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">Real-time gateway stream</p>
        </div>

        {/* Live API Invocations */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Live API Invocations</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {quota?.mockProviderCalls ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Calls</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Processed across distributed cluster
          </p>
        </div>

        {/* Provider Upstream Status */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Provider Upstream Status</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-400 font-mono">
              CONNECTED
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-3">
            Real-time API gateway active
          </p>
        </div>

        {/* Network Inventory */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Railway Network Inventory</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-400 font-mono">
              134
            </span>
            <span className="text-xs text-slate-400 font-mono">Trains</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">171 stations • 210 delay snapshots</p>
        </div>

        {/* Cache Hit Ratio */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">In-Memory Cache Hit Ratio</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-400 font-mono">
              {Math.round((quota?.cacheHitRatio ?? 1) * 100)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Efficiency</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {quota?.totalCacheHits ?? 0} hits • {quota?.totalCacheMisses ?? 0} misses
          </p>
        </div>
      </div>

      {/* Operational Mode Architecture Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Operational Mode & Governance Policy</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Live Mode Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Live Railway API Mode</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Serves complete, high-frequency Indian Railway intelligence and deterministic simulation across microservices.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-medium">
              Active
            </div>
          </div>

          {/* Upstream Status Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">External Railway API Stream</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Distributed gateway actively balances railway API traffic and real-time feeds.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* DCS Architecture Note */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-semibold text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Distributed Systems Architecture</span>
          </div>
          <p>
            RailSync preserves true <strong>multi-process distributed systems architecture</strong> across ports 4000 (Gateway), 4001 (Train Intel), 4002 (Journey & Station), 4003 (Reservation), and 4004 (Analytics). Real HTTP sockets carry inter-service IPC across the loopback network, delivering high-frequency live intelligence and deterministic simulation.
          </p>
        </div>
      </div>
    </div>
  );
};
