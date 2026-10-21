import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Clock, Radio, Train, Search, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onSelectTrain: (trainNumber: string) => void;
}

export const LiveDeparturesView: React.FC<Props> = ({ onSelectTrain }) => {
  const [searchInput, setSearchInput] = useState('NDLS');
  const [activeStation, setActiveStation] = useState('NDLS');
  const [departures, setDepartures] = useState<any[]>([]);
  const [stationName, setStationName] = useState('New Delhi');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartures = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const resp = await Api.getLiveDepartures(code.trim());
      if (resp.success && resp.data) {
        setDepartures(resp.data.departures || []);
        setStationName(resp.data.stationName || code.trim());
        setActiveStation(code.trim());
      } else {
        setError(resp.error?.message || `Unable to fetch live departures for #${code}`);
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching live departures');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) fetchDepartures(searchInput.trim());
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Station Live Departures Board</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live platform departures and arrivals with estimated real-time delays.</p>
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
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{loading ? 'Fetching...' : 'Fetch Departures'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!searched && !loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Station Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enter a station code above (e.g. NDLS, MMCT, CNB, BSB) and click <strong className="text-cyan-400">Fetch Departures</strong> to load real-time platform departure boards.
          </p>
        </div>
      )}

      {searched && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="font-mono text-cyan-400 font-bold text-lg mr-2">{activeStation}</span>
            <span className="font-bold text-white text-base">{stationName}</span>
          </div>
          <span className="text-xs text-slate-400">Next 2 to 4 hours</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Train Number & Name</th>
                <th className="pb-3 font-semibold">Scheduled</th>
                <th className="pb-3 font-semibold">Expected</th>
                <th className="pb-3 font-semibold">Platform</th>
                <th className="pb-3 font-semibold">Destination</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {departures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No immediate departures for {activeStation}. Try NDLS, MMCT, CNB, or BSB.
                  </td>
                </tr>
              ) : (
                departures.map((d, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectTrain(d.trainNumber)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-200">
                      <span className="font-mono text-cyan-400 mr-2">{d.trainNumber}</span>
                      {d.trainName}
                    </td>
                    <td className="py-3 font-mono text-slate-300">{d.scheduledDeparture}</td>
                    <td className="py-3 font-mono text-cyan-300 font-bold">{d.expectedDeparture}</td>
                    <td className="py-3 font-mono text-slate-300">PF #{d.platform}</td>
                    <td className="py-3 text-slate-400">{d.destination}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          d.delayMinutes > 0
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
};
