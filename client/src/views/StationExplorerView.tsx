import React, { useState } from 'react';
import { Api } from '../api';
import { StationSummary } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { Building2, Search, MapPin, Clock, Train, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onSelectTrain: (trainNumber: string) => void;
}

export const StationExplorerView: React.FC<Props> = ({ onSelectTrain }) => {
  const [searchInput, setSearchInput] = useState('NDLS');
  const [stationDetails, setStationDetails] = useState<StationSummary | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStationData = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [detailResp, schedResp] = await Promise.all([
        Api.getStationDetails(code.trim()),
        Api.getStationSchedule(code.trim())
      ]);
      if (detailResp.success && detailResp.data) {
        setStationDetails(detailResp.data);
      } else {
        setError(`Station #${code} not found in database.`);
      }
      if (schedResp.success) setSchedule(schedResp.data?.schedule || []);
    } catch (e: any) {
      setError(e.message || 'Error fetching station telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) fetchStationData(searchInput.trim());
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Station Explorer & Master Timetable</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Platform facilities, regional zone mapping, and daily halting schedules.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Station code (e.g. NDLS, MMCT, CNB)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>{loading ? 'Inspecting...' : 'Inspect Station'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!stationDetails && !loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Station Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enter a station code above (e.g. NDLS, MMCT, CNB, BSB) and click <strong className="text-cyan-400">Inspect Station</strong> to view facilities, zone mapping, and daily schedules.
          </p>
        </div>
      )}

      {stationDetails && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="font-mono text-cyan-400 font-bold text-lg mr-2">{stationDetails.code}</span>
              <span className="text-xl font-bold text-white">{stationDetails.name}</span>
            </div>
            <div className="text-xs text-slate-400">
              Zone: <b className="text-slate-200">{stationDetails.zone}</b> • City: <b className="text-slate-200">{stationDetails.city}, {stationDetails.state}</b>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
              <span className="text-slate-500 block">Total Platforms</span>
              <span className="font-bold text-slate-200 text-base mt-1 block">{stationDetails.platforms} Platforms</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
              <span className="text-slate-500 block">Coordinates</span>
              <span className="font-mono text-cyan-400 mt-1 block">{stationDetails.lat}, {stationDetails.lng}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
              <span className="text-slate-500 block">NTES Reporting</span>
              <span className="font-bold text-emerald-400 mt-1 block">Active Telemetry Node</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
              <span className="text-slate-500 block">Halting Trains</span>
              <span className="font-bold text-slate-200 text-base mt-1 block">{schedule.length} Services</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Scheduled 24-Hour Halts & Terminating Services</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Train Number & Name</th>
                <th className="pb-3 font-semibold">Arrival</th>
                <th className="pb-3 font-semibold">Departure</th>
                <th className="pb-3 font-semibold">Origin → Destination</th>
                <th className="pb-3 font-semibold">Platform</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {schedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-medium text-slate-200">
                    <span className="font-mono text-cyan-400 mr-2">{item.trainNumber}</span>
                    {item.trainName}
                  </td>
                  <td className="py-3 font-mono text-slate-300">{item.arrivalTime}</td>
                  <td className="py-3 font-mono text-slate-300">{item.departureTime}</td>
                  <td className="py-3 text-slate-400">{item.origin} → {item.destination}</td>
                  <td className="py-3 font-mono text-slate-300">PF #{item.platform}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectTrain(item.trainNumber)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all text-[11px]"
                    >
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
