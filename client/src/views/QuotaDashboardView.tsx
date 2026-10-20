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
  Unlock,
  History,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export const QuotaDashboardView: React.FC = () => {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Administrative confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ demoMode?: boolean; liveApiEnabled?: boolean } | null>(null);

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

  const handlePromptModeChange = (demo: boolean, live: boolean) => {
    if (live && !quota?.apiKeyConfigured) {
      alert('RAILRADAR_API_KEY is not configured in backend .env. Please configure your key first.');
      return;
    }
    setPendingAction({ demoMode: demo, liveApiEnabled: live });
    setConfirmModalOpen(true);
  };

  const handleConfirmModeChange = async () => {
    if (!pendingAction) return;
    try {
      await Api.setMode(pendingAction.demoMode, pendingAction.liveApiEnabled);
      await fetchQuotaData();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <span>API Quota & Request Budget Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Strict resource governor enforcing a 100-request monthly limit with conservative 80-request internal cap and emergency buffer.
          </p>
        </div>

        <button
          onClick={fetchQuotaData}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Usage Audit</span>
        </button>
      </div>

      {/* Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Remaining Internal Budget */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Remaining Safe Budget</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {quota?.remainingBudget ?? 80}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {quota?.internalBudget ?? 80} reqs</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, ((quota?.remainingBudget ?? 80) / (quota?.internalBudget ?? 80)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Used Outbound Attempts */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Outbound Calls Attempted</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {quota?.usedThisMonth ?? 0}
            </span>
            <span className="text-xs text-amber-400 font-mono">Calls Consumed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Zero background polling enforced</p>
        </div>

        {/* Emergency Buffer */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">Reserved Emergency Buffer</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {quota?.emergencyBuffer ?? 20}
            </span>
            <span className="text-xs text-slate-400">held reserve</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Guaranteed for final viva evaluation</p>
        </div>

        {/* Cache Hit Ratio */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-xs block">In-Memory Cache Hit Ratio</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {Math.round((quota?.cacheHitRatio ?? 1) * 100)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Efficiency</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {quota?.totalCacheHits ?? 0} hits • {quota?.totalCacheMisses ?? 0} misses
          </p>
        </div>
      </div>

      {/* Operational Mode Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Operational Mode Configuration</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Demo Mode Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Deterministic DEMO_MODE</span>
                {quota?.demoMode && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Serves complete realistic local fixtures without issuing network calls to RailRadar.
              </p>
            </div>
            <button
              onClick={() => handlePromptModeChange(!quota?.demoMode, false)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                quota?.demoMode
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {quota?.demoMode ? 'Demo Active' : 'Switch to Demo'}
            </button>
          </div>

          {/* Live API Enabled Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Live Outbound API Calls</span>
                {quota?.liveCallsEnabled ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                    ENABLED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                    DISABLED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Authorizes backend to make explicit outbound requests to api.railradar.in.
              </p>
            </div>
            <button
              onClick={() => handlePromptModeChange(false, !quota?.liveCallsEnabled)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                quota?.liveCallsEnabled
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300'
              }`}
            >
              {quota?.liveCallsEnabled ? 'Disable Live' : 'Enable Live Calls'}
            </button>
          </div>
        </div>

        {/* Quota Policy Notice */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Quota Governance Notice:</p>
          <p>
            RailSync tracks usage using internal SQLite audit tables. Internal counters represent RailSync's local records; provider-side billing may count differently depending on RailRadar upstream cache policies.
          </p>
          <p className="text-cyan-400">
            Estimated Monthly Reset Date: {quota?.resetDate ? new Date(quota.resetDate).toLocaleDateString('en-IN', { dateStyle: 'full' }) : 'Next Month 1st'}
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Operational Mode Change</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {pendingAction?.liveApiEnabled
                ? 'You are about to enable LIVE RailRadar API requests. Each live train tracking query will consume 1 request from your strict 100-request monthly quota.'
                : 'Switching to DEMO_MODE will ensure all features serve realistic local fixtures without consuming your upstream quota.'}
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              Remaining safe requests: <b className="text-cyan-400 font-mono">{quota?.remainingBudget}</b> requests.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModeChange}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950"
              >
                Confirm Mode Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
