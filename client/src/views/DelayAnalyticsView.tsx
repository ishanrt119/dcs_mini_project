import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { LineChart as ChartIcon, TrendingDown, TrendingUp, Minus, Search, History, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  initialTrainNumber?: string;
}

export const DelayAnalyticsView: React.FC<Props> = ({ initialTrainNumber = '12951' }) => {
  const [searchInput, setSearchInput] = useState(initialTrainNumber);
  const [trend, setTrend] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(initialTrainNumber);
  }, [initialTrainNumber]);

  const fetchAnalytics = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [trendResp, snapsResp] = await Promise.all([
        Api.getDelayTrend(num.trim()),
        Api.getSnapshots(num.trim())
      ]);
      if (trendResp.success) setTrend(trendResp.data);
      if (snapsResp.success) setSnapshots(snapsResp.data || []);
      if (!trendResp.success && !snapsResp.success) {
        setError(`No historical snapshots recorded yet for train #${num}`);
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) fetchAnalytics(searchInput.trim());
  };

  const chartData = snapshots.map(s => ({
    time: new Date(s.snapshot_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    delay: s.observed_delay_minutes,
    speed: s.speed_kmph,
    station: s.station_code
  }));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ChartIcon className="w-6 h-6 text-cyan-400" />
            <span>Delay Trend Analytics & Velocity Insights</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Chronological delay snapshots and velocity calculations stored in local SQLite persistence.</p>
        </div>
        <SourceBadge source="LOCAL_HISTORICAL_OBSERVATION" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Train number (e.g. 12951, 12952)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChartIcon className="w-3.5 h-3.5" />}
            <span>{loading ? 'Analyzing...' : 'Analyze Delay'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!trend && !loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <ChartIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Delay Telemetry Analyzed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enter a train number above and click <strong className="text-cyan-400">Analyze Delay</strong> to compute recovery velocity, regression metrics, and time-series delay graphs.
          </p>
        </div>
      )}

      {trend && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-slate-500 block mb-1">Delay Trend Classification</span>
            <div className="flex items-center gap-2 mt-2">
              {trend.trend === 'Improving' ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <TrendingDown className="w-5 h-5" />
                  <span>Improving (Recovery)</span>
                </div>
              ) : trend.trend === 'Worsening' ? (
                <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
                  <TrendingUp className="w-5 h-5" />
                  <span>Worsening (Cascading)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
                  <Minus className="w-5 h-5" />
                  <span>{trend.trend}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{trend.explanation}</p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-slate-500 block mb-1">Delay Delta Velocity</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
              {trend.diffMinutes > 0 ? `+${trend.diffMinutes}` : trend.diffMinutes} mins
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Change between consecutive observation points</p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-slate-500 block mb-1">Historical Snapshots Analyzed</span>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {snapshots.length} Records
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Timestamped SQLite telemetry observations</p>
          </div>
        </div>
      )}

      {/* Historical Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Delay Trajectory (Minutes vs Checkpoint Timestamp)</span>
        </h3>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="delay" stroke="#06b6d4" strokeWidth={2} fill="url(#delayGrad)" name="Delay (min)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No historical delay snapshots recorded for #{searchInput} yet. Telemetry snapshots record automatically on live tracking queries.
          </div>
        )}
      </div>
    </div>
  );
};
