import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { FolderTree, Train, Building2, Binary, Gauge, Loader2 } from 'lucide-react';

export const DirectoriesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trains' | 'stations' | 'compressed' | 'categories'>('trains');
  const [trains, setTrains] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [compressedData, setCompressedData] = useState<any>(null);
  const [decompressedTuples, setDecompressedTuples] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [speedTypes, setSpeedTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Track which tabs have already been loaded
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trains') {
        const resp = await Api.getTrainDirectory();
        if (resp.success) setTrains(resp.data || []);
      } else if (activeTab === 'stations') {
        const resp = await Api.getStationDirectory();
        if (resp.success) setStations(resp.data || []);
      } else if (activeTab === 'compressed') {
        const resp = await Api.getCompressedTrains();
        if (resp.success && resp.data) {
          setCompressedData(resp.data);
          try {
            const decodedStr = atob(resp.data.payload);
            setDecompressedTuples(JSON.parse(decodedStr));
          } catch (e) {
            //
          }
        }
      } else if (activeTab === 'categories') {
        const [catResp, spdResp] = await Promise.all([
          Api.getTrainCategories(),
          Api.getSpeedTypes()
        ]);
        if (catResp.success) setCategories(catResp.data || []);
        if (spdResp.success) setSpeedTypes(spdResp.data || []);
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
            <FolderTree className="w-6 h-6 text-cyan-400" />
            <span>Master Railway Reference Directories</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">National trains, stations, speed classes, and high-density compressed payloads.</p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('trains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'trains'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>Train Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'stations'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Station Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('compressed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'compressed'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Compressed Feeds</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Speed & Categories</span>
        </button>
      </div>

      {/* TAB 1: TRAINS */}
      {activeTab === 'trains' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered Trains Master Directory</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Train className="w-3.5 h-3.5" />}
              <span>{loading ? 'Loading...' : 'Load Directory'}</span>
            </button>
          </div>
          {!loaded.has('trains') && !loading ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Directory</span> to fetch the trains master index.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Number & Name</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Speed Tier</th>
                    <th className="pb-3 font-semibold">Route Path</th>
                    <th className="pb-3 font-semibold">Operating Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {trains.map(t => (
                    <tr key={t.trainNumber} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-200">
                        <span className="font-mono text-cyan-400 font-bold mr-2">{t.trainNumber}</span>
                        {t.trainName}
                      </td>
                      <td className="py-3 text-slate-300">{t.category}</td>
                      <td className="py-3 text-slate-400">{t.speedType}</td>
                      <td className="py-3 text-slate-400">{t.origin?.name} → {t.destination?.name}</td>
                      <td className="py-3 text-slate-400 font-mono">{t.operatingDays?.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STATIONS */}
      {activeTab === 'stations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Station Geographic Index</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
              <span>{loading ? 'Loading...' : 'Load Directory'}</span>
            </button>
          </div>
          {!loaded.has('stations') && !loading ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Directory</span> to fetch the station geographic index.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Code & Station</th>
                    <th className="pb-3 font-semibold">City, State</th>
                    <th className="pb-3 font-semibold">Railway Zone</th>
                    <th className="pb-3 font-semibold">Platforms</th>
                    <th className="pb-3 font-semibold">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {stations.map(s => (
                    <tr key={s.code} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-200">
                        <span className="font-mono text-cyan-400 font-bold mr-2">{s.code}</span>
                        {s.name}
                      </td>
                      <td className="py-3 text-slate-300">{s.city}, {s.state}</td>
                      <td className="py-3 font-mono text-slate-400">{s.zone}</td>
                      <td className="py-3 text-slate-300 font-mono">{s.platforms}</td>
                      <td className="py-3 text-slate-500 font-mono">{s.lat}, {s.lng}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPRESSED DATASETS */}
      {activeTab === 'compressed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">High-Density Compressed Feed</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Binary className="w-3.5 h-3.5" />}
              <span>{loading ? 'Decoding...' : 'Load Compressed Feed'}</span>
            </button>
          </div>
          {!loaded.has('compressed') && !loading && (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Compressed Feed</span> to decode the high-density delta payload.
            </div>
          )}
          {compressedData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Compressed High-Density Delta Feed</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                {compressedData.encoding} • Checksum: {compressedData.checksum}
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Raw Encoded Payload (Base64 Tuple String)
              </span>
              <div className="font-mono text-xs text-slate-400 break-all bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {compressedData.payload}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Decoded In-Memory Representation ({decompressedTuples.length} records parsed)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {decompressedTuples.map((tuple, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                    <span className="font-mono font-bold text-cyan-400 text-sm">{tuple[0]}</span>
                    <div className="font-medium text-slate-200 mt-1 truncate">{tuple[1]}</div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{tuple[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES & SPEED TYPES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Speed Classes & Train Categories</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gauge className="w-3.5 h-3.5" />}
              <span>{loading ? 'Loading...' : 'Load Categories'}</span>
            </button>
          </div>
          {!loaded.has('categories') && !loading ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Click <span className="text-cyan-400 font-semibold">Load Categories</span> to fetch speed tiers and official train categories.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Train className="w-4 h-4 text-cyan-400" />
              <span>Official Train Categories</span>
            </h3>
            <div className="space-y-2 text-xs">
              {categories.map((cat, idx) => (
                <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-slate-200 font-medium">
                  {cat}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Operating Speed Tiers</span>
            </h3>
            <div className="space-y-2 text-xs">
              {speedTypes.map((st, idx) => (
                <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                  <span className="font-medium text-slate-200">{st.type}</span>
                  <span className="font-mono font-bold text-emerald-400">{st.maxKmph} km/h max</span>
                </div>
              ))}
            </div>
          </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
};
