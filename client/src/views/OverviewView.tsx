import React, { useEffect, useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Train, Clock, Radio, Activity, ShieldAlert, ArrowRight, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  onNavigate: (view: any, trainNumber?: string) => void;
}

export const OverviewView: React.FC<Props> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const resp = await Api.getOverview();
      if (resp.success) {
        setData(resp.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-800/60 rounded-md w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const flagship = data?.flagshipLiveStatus;
  const quota = data?.quotaStatus;
  const incidents = data?.activeIncidents || [];
  const savedTrains = data?.savedTrains || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Source Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Operations & Telemetry Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-service telemetry, delay tracking, and distributed rail intelligence grid.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source="SIMULATED_DEMO_DATA" />
          <button
            onClick={loadOverview}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Refresh Local View
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Trains */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Network Trains Tracked</span>
            <Train className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{data?.activeTrainsCount || 4}</span>
            <span className="text-xs text-emerald-400 font-medium">Flagships Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rajdhani, Vande Bharat, Shatabdi</p>
        </div>

        {/* Quota Metric */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>RailRadar Internal Budget</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">{quota?.remainingBudget ?? 80}</span>
            <span className="text-xs text-slate-400">/ {quota?.internalBudget ?? 80} allowed</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full"
              style={{ width: `${Math.min(100, ((quota?.remainingBudget ?? 80) / 80) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{incidents.length}</span>
            <span className="text-xs text-amber-400 font-medium">Track Alerts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Deduplicated station & signal notices</p>
        </div>

        {/* Distributed Cluster Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>DCS Cluster Nodes</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">5 / 5 UP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">HTTP Inter-Process Communication</p>
        </div>
      </div>

      {/* Main Flagship Train Card */}
      {flagship && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#0e1b33] border border-cyan-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 font-bold font-mono text-sm border border-cyan-800">
                  #{flagship.trainNumber}
                </span>
                <span className="text-lg font-bold text-white">{flagship.trainName}</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {flagship.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 block">Current Location</span>
                  <span className="font-semibold text-slate-200">{flagship.currentLocation?.stationName} ({flagship.currentLocation?.stationCode})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Telemetry Speed</span>
                  <span className="font-semibold text-cyan-400 font-mono">{flagship.currentSpeedKmph} km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Delay</span>
                  <span className={`font-semibold ${flagship.delayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {flagship.delayMinutes === 0 ? 'On Time' : `+${flagship.delayMinutes} mins`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Next Halt</span>
                  <span className="font-semibold text-slate-200">NDLS (New Delhi)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('live-train', flagship.trainNumber)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950 transition-all self-start lg:self-center"
            >
              <span>Inspect Live Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Two Column Grid: Watched Trains & Incident Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watched Trains */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Train className="w-4 h-4 text-cyan-400" />
              <span>Watched Trains (Local SQLite Store)</span>
            </h2>
            <span className="text-xs text-slate-500">{savedTrains.length} saved</span>
          </div>

          <div className="space-y-2">
            {savedTrains.map((st: any) => (
              <div
                key={st.train_number}
                onClick={() => onNavigate('live-train', st.train_number)}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400">{st.train_number}</span>
                    <span className="font-medium text-slate-200">{st.train_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{st.notes}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Active Incident Notices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Operational Incident Stream</span>
            </h2>
            <button
              onClick={() => onNavigate('disruption-sim')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Disruption Simulator →
            </button>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {incidents.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No active incidents recorded.</div>
            ) : (
              incidents.map((inc: any) => (
                <div
                  key={inc.incident_id || inc.id}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    inc.severity === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                      : inc.severity === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{inc.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{inc.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Module Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <button
            onClick={() => onNavigate('journey-planner')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-semibold text-slate-200">Journey Planner</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct & connecting routes</p>
          </button>

          <button
            onClick={() => onNavigate('seat-availability')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-semibold text-slate-200">Seat Availability</div>
            <p className="text-[11px] text-slate-500 mt-0.5">GN, Tatkal, Ladies quotas</p>
          </button>

          <button
            onClick={() => onNavigate('pnr-status')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-105 transition-transform">
              <Train className="w-4 h-4" />
            </div>
            <div className="font-semibold text-slate-200">PNR & Predictions</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Passenger confirmation odds</p>
          </button>

          <button
            onClick={() => onNavigate('distributed-monitor')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div className="font-semibold text-slate-200">DCS Architecture Demo</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Simulate 503 outage & RPC</p>
          </button>
        </div>
      </div>
    </div>
  );
};
