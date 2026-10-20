import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Layers, Train, MapPin, Footprints, Search } from 'lucide-react';

interface Props {
  initialTrainNumber?: string;
}

export const CoachPlatformView: React.FC<Props> = ({ initialTrainNumber = '12951' }) => {
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber);
  const [coachData, setCoachData] = useState<any>(null);
  const [platformData, setPlatformData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(trainNumber);
  }, [trainNumber]);

  const fetchData = async (num: string) => {
    setLoading(true);
    try {
      const [cResp, pResp] = await Promise.all([
        Api.getCoachLayout(num),
        Api.getPlatformPositions(num)
      ]);
      if (cResp.success) setCoachData(cResp.data);
      if (pResp.success) setPlatformData(pResp.data);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>Coach Layout & Platform Alignment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Rake composition sequencing, class berth capacities, and station foot-over-bridge alignment.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={trainNumber}
              onChange={e => setTrainNumber(e.target.value)}
              placeholder="Train number..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <button type="submit" className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs">
            Inspect Rake
          </button>
        </form>
      </div>

      {coachData && (
        <div className="space-y-6">
          {/* Visual Rake Coach Track Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-cyan-400 font-bold text-base mr-2">{coachData.trainNumber}</span>
                <span className="font-bold text-white text-base">{coachData.trainName}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {coachData.rakeType} Standard
                </span>
              </div>
              <span className="text-xs text-slate-400">← Engine Direction (Front)</span>
            </div>

            {/* Coach Chain */}
            <div className="overflow-x-auto pb-4 pt-2">
              <div className="flex items-center gap-2 min-w-max">
                {/* Engine */}
                <div className="w-20 h-16 rounded-xl bg-gradient-to-r from-cyan-900 to-cyan-800 border-2 border-cyan-500 flex flex-col items-center justify-center text-xs text-white shadow-lg">
                  <Train className="w-5 h-5 text-cyan-300 mb-0.5" />
                  <span className="font-mono font-bold text-[10px]">WAP-7</span>
                </div>

                {/* Coaches */}
                {coachData.coaches.map((c: any) => {
                  const is1A = c.classType === '1A';
                  const is2A = c.classType === '2A';
                  const is3A = c.classType === '3A';
                  const isChair = c.classType === 'CC' || c.classType === 'EC';

                  return (
                    <div
                      key={c.position}
                      className={`w-20 h-16 rounded-xl border flex flex-col items-center justify-center text-xs transition-transform hover:-translate-y-1 shadow-sm ${
                        is1A
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                          : is2A
                          ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                          : is3A
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : isChair
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="font-mono font-extrabold text-sm">{c.code}</span>
                      <span className="text-[10px] opacity-80">{c.classType}</span>
                      <span className="text-[9px] opacity-60 font-mono">#{c.position}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform Foot Over Bridge Proximity */}
          {platformData?.positions && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-cyan-400" />
                  <span>Platform Alignment & Foot Over Bridge (FOB) Proximity</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {platformData.currentStation} • Platform #{platformData.platform}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {platformData.positions.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{p.coachCode}</span>
                        <span className="text-slate-300">({p.classType})</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {p.platformAlignment}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{p.nearestFob}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-cyan-400 font-bold">{p.escalatorProximityMeters}m</span>
                      <span className="text-[10px] text-slate-500 block">to stairs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
