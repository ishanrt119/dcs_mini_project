import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { TramFront, Container, Clock, MapPin, Gauge, Loader2 } from 'lucide-react';

export const SuburbanFreightView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suburban' | 'freight'>('suburban');
  const [suburbanTimetables, setSuburbanTimetables] = useState<any[]>([]);
  const [suburbanCities, setSuburbanCities] = useState<any[]>([]);
  const [freightData, setFreightData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'suburban') {
        const [ttResp, cityResp] = await Promise.all([
          Api.getSuburbanTimetables(),
          Api.getSuburbanCities()
        ]);
        if (ttResp.success) setSuburbanTimetables(ttResp.data || []);
        if (cityResp.success) setSuburbanCities(cityResp.data || []);
      } else {
        const resp = await Api.getFreightTrains();
        if (resp.success) setFreightData(resp.data || []);
      }
      setLoaded(prev => new Set([...prev, activeTab]));
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
            <TramFront className="w-6 h-6 text-cyan-400" />
            <span>Suburban Commuter & Dedicated Freight Grid</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">High-density metropolitan suburban local services and freight corridor rakes.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('suburban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'suburban'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TramFront className="w-4 h-4" />
          <span>Suburban Commuter Networks</span>
        </button>

        <button
          onClick={() => setActiveTab('freight')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'freight'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Container className="w-4 h-4" />
          <span>Dedicated Freight Corridor (DFC)</span>
        </button>
      </div>

      {activeTab === 'suburban' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Suburban Commuter Networks</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TramFront className="w-3.5 h-3.5" />}
              <span>{loading ? 'Loading...' : 'Load Suburban Data'}</span>
            </button>
          </div>
          {!loaded.has('suburban') && !loading ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Suburban Data</span> to fetch commuter network timetables.
            </div>
          ) : (
            <>
            {/* City Network Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {suburbanCities.map(c => (
                <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm text-xs">
                  <span className="font-bold text-white text-sm">{c.name}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">{c.network}</span>
                  <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Daily Ridership</span>
                    <span className="font-bold font-mono text-cyan-400">{c.dailyRidership}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timetables */}
            <div className="space-y-4">
              {suburbanTimetables.map((corridor, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white">{corridor.corridor}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                      {corridor.city} Network
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Service ID</th>
                          <th className="pb-3 font-semibold">Source</th>
                          <th className="pb-3 font-semibold">Destination</th>
                          <th className="pb-3 font-semibold">Dep Time</th>
                          <th className="pb-3 font-semibold text-right">Rake Class</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {corridor.services.map((s: any) => (
                          <tr key={s.trainId} className="hover:bg-slate-800/40">
                            <td className="py-2.5 font-mono font-bold text-cyan-400">{s.trainId}</td>
                            <td className="py-2.5 text-slate-200">{s.source}</td>
                            <td className="py-2.5 text-slate-200">{s.destination}</td>
                            <td className="py-2.5 text-slate-300 font-mono">{s.departureTime}</td>
                            <td className="py-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.type === 'AC'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : s.type === 'Fast'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {s.type} Service
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'freight' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Dedicated Freight Corridor (DFC)</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Container className="w-3.5 h-3.5" />}
              <span>{loading ? 'Loading...' : 'Load Freight Data'}</span>
            </button>
          </div>
          {!loaded.has('freight') && !loading ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Freight Data</span> to fetch DFC rake details.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freightData.map(f => (
            <div key={f.rakeId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-cyan-400 font-bold text-sm">{f.rakeId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  {f.status}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">Commodity Cargo</span>
                <span className="font-bold text-white text-base mt-0.5 block">{f.commodity}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 space-y-1.5">
                <div className="text-slate-400">
                  <span className="text-slate-500">Corridor:</span> {f.corridor}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Origin:</span> {f.origin}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Destination:</span> {f.destination}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-center">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">Wagons</span>
                  <span className="font-mono text-white font-bold">{f.wagons} Rakes</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">Speed</span>
                  <span className="font-mono text-cyan-400 font-bold">{f.speedKmph} km/h</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block text-[9px]">Gross Weight</span>
                  <span className="font-mono text-emerald-400 font-bold">{f.grossWeightTons} T</span>
                </div>
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
