import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Train, Calendar, Utensils, Zap, MapPin, Search } from 'lucide-react';

interface Props {
  initialTrainNumber?: string;
}

export const TrainDetailsView: React.FC<Props> = ({ initialTrainNumber = '12951' }) => {
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber);
  const [trainDetail, setTrainDetail] = useState<any>(null);
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(trainNumber);
  }, [trainNumber]);

  const fetchData = async (num: string) => {
    setLoading(true);
    try {
      const [detailResp, ttResp] = await Promise.all([
        Api.getTrainDetails(num),
        Api.getTimetable(num)
      ]);
      if (detailResp.success) setTrainDetail(detailResp.data);
      if (ttResp.success) setTimetable(ttResp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainNumber.trim()) fetchData(trainNumber.trim());
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Train Details & Timetable</h1>
          <p className="text-xs text-slate-400 mt-1">Master timetable, coach configuration, and rake technical specifications.</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={trainNumber}
            onChange={e => setTrainNumber(e.target.value)}
            placeholder="Train number..."
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs">
            Query
          </button>
        </form>
      </div>

      {trainDetail && (
        <>
          {/* Metadata Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-cyan-400 px-3 py-1 bg-cyan-950 border border-cyan-800 rounded-lg">
                  {trainDetail.trainNumber}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">{trainDetail.trainName}</h2>
                  <span className="text-xs text-slate-400">{trainDetail.category} • {trainDetail.speedType}</span>
                </div>
              </div>
              <SourceBadge source="SIMULATED_DEMO_DATA" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Origin → Destination</span>
                <span className="font-bold text-slate-200 mt-1 block">
                  {trainDetail.origin?.name} → {trainDetail.destination?.name}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Total Distance</span>
                <span className="font-bold text-cyan-400 font-mono mt-1 block">{trainDetail.totalDistanceKm} km</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Total Duration</span>
                <span className="font-bold text-slate-200 font-mono mt-1 block">
                  {Math.floor(trainDetail.totalDurationMinutes / 60)}h {trainDetail.totalDurationMinutes % 60}m
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-slate-500 block">Rake Standard</span>
                <span className="font-bold text-emerald-400 mt-1 block">{trainDetail.rakeType} Modern Rake</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Operating Days: <b className="text-slate-200">{trainDetail.operatingDays?.join(', ')}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>Pantry Car: <b className="text-slate-200">{trainDetail.pantryAvailable ? 'Available (Catering on board)' : 'Not Available'}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Available Classes: <b className="text-slate-200">{trainDetail.classes?.join(', ')}</b></span>
              </div>
            </div>
          </div>

          {/* Timetable Table */}
          {timetable?.halts && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Complete Route Halts & Distance Matrix</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Station</th>
                      <th className="pb-3 font-semibold">Day</th>
                      <th className="pb-3 font-semibold">Arr Time</th>
                      <th className="pb-3 font-semibold">Dep Time</th>
                      <th className="pb-3 font-semibold">Distance</th>
                      <th className="pb-3 font-semibold">Platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {timetable.halts.map((h: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-medium text-slate-200">
                          <span className="font-mono text-cyan-400 mr-2">{h.stationCode}</span>
                          {h.stationName}
                        </td>
                        <td className="py-2.5 text-slate-400">Day {h.dayNumber}</td>
                        <td className="py-2.5 text-slate-300 font-mono">{h.scheduledArrival}</td>
                        <td className="py-2.5 text-slate-300 font-mono">{h.scheduledDeparture}</td>
                        <td className="py-2.5 text-slate-400 font-mono">{h.distanceKm} km</td>
                        <td className="py-2.5 text-slate-400 font-mono">PF #{h.platform || '1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
