import React, { useState, useEffect } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { LeafletTrainMap } from '../components/LeafletTrainMap';
import { MapPin, Train, Gauge, Clock, ChevronRight, Loader2, Radio } from 'lucide-react';

interface Props {
  onSelectTrain: (trainNumber: string) => void;
}

export const NetworkMapView: React.FC<Props> = ({ onSelectTrain }) => {
  const [trains, setTrains] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchMapFeed = async () => {
    setLoading(true);
    try {
      const resp = await Api.getMapFeed();
      if (resp.success && resp.data) {
        setTrains(resp.data);
        if (resp.data.length > 0) setSelectedTrain(resp.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  // Automatically load the map feed when the view mounts
  useEffect(() => {
    fetchMapFeed();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" />
            <span>National Railway Network Map Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Geospatial telemetry cluster visualizing operating trains and track corridors across India.</p>
        </div>
        <div className="flex items-center gap-3">
          <SourceBadge source="LIVE_PROVIDER_DATA" />
          <button
            onClick={fetchMapFeed}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            <span>{loading ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 space-y-4 relative">
          {loading && !loaded && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-20 rounded-xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-300 font-medium">Loading geospatial train telemetry...</span>
            </div>
          )}

          <LeafletTrainMap
            allTrains={trains}
            selectedTrainNumber={selectedTrain?.trainNumber}
            onSelectTrain={trainNum => {
              const matched = trains.find(t => t.trainNumber === trainNum);
              if (matched) setSelectedTrain(matched);
            }}
            coordinates={selectedTrain?.routeGeometry || []}
            currentPosition={
              selectedTrain
                ? {
                    lat: selectedTrain.lat,
                    lng: selectedTrain.lng,
                    stationName: selectedTrain.stationName
                  }
                : undefined
            }
            height="560px"
          />
        </div>

        {/* Telemetry Train List Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Telemetry Rakes</h2>
            <span className="text-xs text-slate-500 font-mono">{trains.length} Active</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {trains.map(t => {
              const isSelected = selectedTrain?.trainNumber === t.trainNumber;
              return (
                <div
                  key={t.trainNumber}
                  onClick={() => setSelectedTrain(t)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-slate-850 border-cyan-500/80 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {t.trainNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                        t.delayMinutes > 0
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      }`}
                    >
                      {t.delayMinutes === 0 ? 'On Time' : `+${t.delayMinutes}m`}
                    </span>
                  </div>

                  <div className="font-bold text-white mt-2 truncate">{t.trainName}</div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Current Station</span>
                      <span className="font-medium text-slate-200">{t.stationName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Speed</span>
                      <span className="font-mono text-cyan-300 font-semibold">{t.speedKmph} km/h</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{t.category}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectTrain(t.trainNumber);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Track Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
