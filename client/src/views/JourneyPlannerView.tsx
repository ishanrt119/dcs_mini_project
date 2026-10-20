import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Compass, Calendar, ArrowRight, Train, Clock, ArrowRightLeft } from 'lucide-react';

interface Props {
  onSelectTrain: (trainNumber: string) => void;
  onCheckAvailability: (trainNumber: string, from: string, to: string) => void;
}

export const JourneyPlannerView: React.FC<Props> = ({ onSelectTrain, onCheckAvailability }) => {
  const [fromStation, setFromStation] = useState('MMCT');
  const [toStation, setToStation] = useState('NDLS');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handlePlanJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;

    setLoading(true);
    setSearched(true);
    try {
      const resp = await Api.planRoute(fromStation, toStation, date);
      if (resp.success && resp.data) {
        setRoutes(resp.data.routes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            <span>Multi-Leg Railway Journey Planner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Direct and connecting train routes between any Indian Railways stations.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      {/* Query Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handlePlanJourney} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Origin Station Code
            </label>
            <input
              type="text"
              value={fromStation}
              onChange={e => setFromStation(e.target.value.toUpperCase())}
              placeholder="e.g. MMCT, NDLS, HWH"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Destination Station Code
            </label>
            <input
              type="text"
              value={toStation}
              onChange={e => setToStation(e.target.value.toUpperCase())}
              placeholder="e.g. NDLS, BVI, KOTA"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSwap}
              className="absolute right-2 top-7 p-1 rounded hover:bg-slate-800 text-slate-400"
              title="Swap stations"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Travel Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-950 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{loading ? 'Calculating...' : 'Find Route Options'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Available Routes ({routes.length} found)
            </h2>
            <span className="text-xs text-slate-400">{fromStation} → {toStation}</span>
          </div>

          {routes.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No direct or planned services found for this pair. Try MMCT to NDLS, or NDLS to BSB.
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                        {r.trainNumber}
                      </span>
                      <span className="font-bold text-sm text-white">{r.trainName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {r.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Departs</span>
                        <span className="font-mono font-bold text-cyan-300">{r.departureTime}</span> ({r.departureStation})
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">Arrives</span>
                        <span className="font-mono font-bold text-emerald-300">{r.arrivalTime}</span> ({r.arrivalStation})
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Distance</span>
                        <span className="font-mono text-slate-300">{r.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onCheckAvailability(r.trainNumber, fromStation, toStation)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      Seat Availability
                    </button>
                    <button
                      onClick={() => onSelectTrain(r.trainNumber)}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md shadow-cyan-950 transition-colors"
                    >
                      Live Tracking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
