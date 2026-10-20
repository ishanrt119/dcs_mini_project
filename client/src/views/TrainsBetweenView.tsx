import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { ArrowRightLeft, Train, Clock, ArrowRight } from 'lucide-react';

interface Props {
  onSelectTrain: (trainNumber: string) => void;
}

export const TrainsBetweenView: React.FC<Props> = ({ onSelectTrain }) => {
  const [from, setFrom] = useState('NDLS');
  const [to, setTo] = useState('BSB');
  const [trains, setTrains] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const resp = await Api.getTrainsBetween(from, to);
      if (resp.success && resp.data) {
        setTrains(resp.data.trains || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-cyan-400" />
            <span>Trains Between Stations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Direct train schedule lookup matching origin and destination endpoints.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From Code</label>
            <input
              type="text"
              value={from}
              onChange={e => setFrom(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To Code</label>
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-950"
          >
            {loading ? 'Searching...' : 'Search Direct Trains'}
          </button>
        </form>
      </div>

      {searched && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Direct Services ({trains.length} trains found)</h2>
          {trains.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No direct trains found between {from} and {to}. Try NDLS to BSB or MMCT to NDLS.
            </div>
          ) : (
            trains.map((t, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">{t.trainNumber}</span>
                    <span className="font-bold text-white text-sm">{t.trainName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{t.category}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300 mt-2">
                    <span>Departs: <b className="text-cyan-300 font-mono">{t.departureTime}</b></span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span>Arrives: <b className="text-emerald-300 font-mono">{t.arrivalTime}</b></span>
                    <span>Duration: <b className="text-slate-200">{t.duration}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Classes</span>
                    <span className="text-slate-300 font-semibold">{t.classes?.join(' ')}</span>
                  </div>
                  <button
                    onClick={() => onSelectTrain(t.trainNumber)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-950"
                  >
                    Track Status
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
