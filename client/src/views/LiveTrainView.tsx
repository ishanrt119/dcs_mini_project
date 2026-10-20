import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { LiveTrainStatus } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { LeafletTrainMap } from '../components/LeafletTrainMap';
import {
  Train,
  Calendar,
  Clock,
  Gauge,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Radio,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle
} from 'lucide-react';

interface Props {
  initialTrainNumber?: string;
}

export const LiveTrainView: React.FC<Props> = ({ initialTrainNumber = '12951' }) => {
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber);
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);
  const [authoritative, setAuthoritative] = useState(false);
  const [statusData, setStatusData] = useState<LiveTrainStatus | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveStatus(trainNumber);
  }, [trainNumber]);

  const fetchLiveStatus = async (num: string, bypassCache: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await Api.getLiveStatus(num, { date: journeyDate, authoritative: bypassCache });
      if (resp.success && resp.data) {
        setStatusData(resp.data);
        setMeta(resp.meta);

        // Fetch delay trend in parallel
        const trendResp = await Api.getDelayTrend(num);
        if (trendResp.success) {
          setTrend(trendResp.data);
        }

        // Check if train is saved
        const savedList = await Api.getSavedTrains();
        if (savedList.success && savedList.data) {
          setIsSaved(savedList.data.some((t: any) => t.train_number === num));
        }
      } else {
        setError(resp.error?.message || 'Unable to retrieve live status for specified train.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error communicating with Gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!statusData) return;
    if (isSaved) {
      await Api.removeSavedTrain(statusData.trainNumber);
      setIsSaved(false);
    } else {
      await Api.saveTrain(statusData.trainNumber, statusData.trainName, 'Saved from Live View');
      setIsSaved(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainNumber.trim()) {
      fetchLiveStatus(trainNumber.trim(), authoritative);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Search Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Train Number / Identifier
            </label>
            <div className="relative">
              <input
                type="text"
                value={trainNumber}
                onChange={e => setTrainNumber(e.target.value)}
                placeholder="Enter 5-digit number (e.g. 12951, 22436)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <Train className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="w-44">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Journey Date
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={e => setJourneyDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end mb-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={authoritative}
                onChange={e => setAuthoritative(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-[11px]">Authoritative (Bypass Cache)</span>
            </label>
          </div>

          <div className="self-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-cyan-950 transition-all flex items-center gap-2"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{loading ? 'Tracking...' : 'Query Live Status'}</span>
            </button>
          </div>
        </form>

        {authoritative && (
          <div className="mt-3 p-2 rounded bg-amber-950/40 border border-amber-800/50 flex items-center gap-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Authoritative mode bypasses internal and upstream cache. Use sparingly to protect monthly quota.</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusData && (
        <>
          {/* Main Status Hero Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold text-cyan-400 px-3 py-1 bg-cyan-950 border border-cyan-800 rounded-lg">
                    {statusData.trainNumber}
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">{statusData.trainName}</h2>
                  <button
                    onClick={handleToggleSave}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={isSaved ? 'Remove from saved' : 'Save train'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      statusData.delayMinutes === 0
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {statusData.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Last update: {new Date(statusData.lastUpdatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Source Provenance Badge */}
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <SourceBadge
                  source={meta?.source}
                  isCached={meta?.isCached}
                  ttlRemaining={meta?.cacheTtlRemainingSec}
                />
                <span className="text-[10px] text-slate-500">
                  Trace ID: <span className="font-mono text-slate-400">{meta?.traceId || 'trace-local'}</span>
                </span>
              </div>
            </div>

            {/* Telemetry Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Current Position</span>
                </div>
                <div className="font-bold text-slate-200 text-sm">{statusData.currentLocation?.stationName}</div>
                <div className="text-[11px] text-slate-500 font-mono">Code: {statusData.currentLocation?.stationCode}</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Speed</span>
                </div>
                <div className="font-bold text-cyan-300 font-mono text-sm">{statusData.currentSpeedKmph} km/h</div>
                <div className="text-[11px] text-slate-500">Track Section Speed</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Observed Delay</span>
                </div>
                <div className={`font-bold font-mono text-sm ${statusData.delayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {statusData.delayMinutes === 0 ? 'On Time' : `+${statusData.delayMinutes} min`}
                </div>
                <div className="text-[11px] text-slate-500">Relative to schedule</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  {trend?.trend === 'Improving' ? (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  ) : trend?.trend === 'Worsening' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Historical Trend</span>
                </div>
                <div className="font-bold text-slate-200 text-sm">{trend?.trend || 'Stable'}</div>
                <div className="text-[10px] text-slate-500 truncate" title={trend?.explanation}>
                  {trend?.explanation || 'Calculated from snapshots'}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Route Geometry Map */}
          {statusData.geometry && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Geospatial Track Layout & Position Marker</span>
                </h3>
                <span className="text-xs text-slate-500">CartoDB Dark Matter Railway Grid</span>
              </div>
              <LeafletTrainMap
                coordinates={statusData.geometry.coordinates}
                currentPosition={
                  statusData.currentLocation?.lat
                    ? {
                        lat: statusData.currentLocation.lat,
                        lng: statusData.currentLocation.lng || 77.2,
                        stationName: statusData.currentLocation.stationName
                      }
                    : undefined
                }
                stations={statusData.route
                  .filter(h => h.distanceKm !== undefined)
                  .map(h => ({
                    lat: h.stationCode === 'MMCT' ? 18.9696 : h.stationCode === 'NDLS' ? 28.6424 : h.stationCode === 'KOTA' ? 25.18 : 22.3107,
                    lng: h.stationCode === 'MMCT' ? 72.8193 : h.stationCode === 'NDLS' ? 77.2195 : h.stationCode === 'KOTA' ? 75.83 : 73.1812,
                    name: h.stationName,
                    code: h.stationCode
                  }))}
                height="380px"
              />
            </div>
          )}

          {/* Detailed Halts & Route Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Route Milestones & Scheduled Halts</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Station / Halt</th>
                    <th className="pb-3 font-semibold">Distance</th>
                    <th className="pb-3 font-semibold">Scheduled Arr / Dep</th>
                    <th className="pb-3 font-semibold">Actual / Expected</th>
                    <th className="pb-3 font-semibold">Platform</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {statusData.route.map((halt, idx) => {
                    const isLate = halt.delayArrivalMinutes > 0 || halt.delayDepartureMinutes > 0;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          halt.isCurrent ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <td className="py-3 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 text-[11px] font-bold">{halt.stationCode}</span>
                            <span>{halt.stationName}</span>
                            {halt.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[9px] font-bold border border-cyan-800">
                                CURRENT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-slate-400 font-mono">{halt.distanceKm} km</td>
                        <td className="py-3 text-slate-300 font-mono">
                          {halt.scheduledArrival} / {halt.scheduledDeparture}
                        </td>
                        <td className="py-3 text-slate-300 font-mono">
                          {halt.actualArrival || halt.scheduledArrival} / {halt.actualDeparture || halt.scheduledDeparture}
                        </td>
                        <td className="py-3 text-slate-400 font-mono">PF #{halt.platform || '1'}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                              isLate
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            }`}
                          >
                            {isLate ? `+${halt.delayArrivalMinutes || halt.delayDepartureMinutes}m` : 'On Time'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
