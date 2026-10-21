import React, { useState } from 'react';
import { Api } from '../api';
import { SourceBadge } from '../components/SourceBadge';
import { Flame, AlertTriangle, ShieldCheck, Clock, Train } from 'lucide-react';

export const DisruptionSimView: React.FC = () => {
  const [stationCode, setStationCode] = useState('CNB');
  const [disruptionType, setDisruptionType] = useState('SIGNAL_FAILURE');
  const [severityHours, setSeverityHours] = useState(2.5);
  const [corridor, setCorridor] = useState('NCR Main Line Grid');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await Api.simulateDisruption({
        stationCode,
        disruptionType,
        severityHours,
        affectedCorridor: corridor
      });
      if (resp.success) setResult(resp.data);
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
            <Flame className="w-6 h-6 text-amber-400" />
            <span>Station Disruption & Cascade Delay Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate operational disruptions (signal failures, maintenance, weather blocks) to model downstream train queue delays.
          </p>
        </div>
        <SourceBadge source="SIMULATED_DEMO_DATA" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Operational Safety Isolation: Simulation runs purely in local analytics memory and SQLite. External networks are never contacted.</span>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Station</label>
            <select
              value={stationCode}
              onChange={e => setStationCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="CNB">Kanpur Central (CNB)</option>
              <option value="NDLS">New Delhi (NDLS)</option>
              <option value="MMCT">Mumbai Central (MMCT)</option>
              <option value="HWH">Howrah Junction (HWH)</option>
              <option value="BSB">Varanasi Junction (BSB)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Disruption Event</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="SIGNAL_FAILURE">Electronic Interlocking Signal Failure</option>
              <option value="TRACK_MAINTENANCE">Overhead Traction Maintenance Block</option>
              <option value="WEATHER_DISRUPTION">Severe Fog Visibility Hazard</option>
              <option value="ACCIDENT">Track Obstruction Clearance</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity Duration</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              value={severityHours}
              onChange={e => setSeverityHours(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Track Corridor</label>
            <input
              type="text"
              value={corridor}
              onChange={e => setCorridor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md shadow-amber-950 flex items-center justify-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>{loading ? 'Simulating...' : 'Inject Disruption'}</span>
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block">Simulation Node ID</span>
              <span className="font-mono text-cyan-400 font-bold text-base mt-1 block">{result.simulationId}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">{result.stationName} ({result.stationCode})</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block">Estimated Spread Delay Impact</span>
              <span className="font-mono text-amber-400 font-bold text-xl mt-1 block">
                ~{result.estimatedDelaySpreadMinutes} mins
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Cascade buffer calculated</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-slate-500 block">Potentially Affected Trains</span>
              <span className="font-mono text-white font-bold text-xl mt-1 block">
                {result.potentiallyAffectedTrains.length} Services
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Within affected block section</span>
            </div>
          </div>

          {/* Affected Trains Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Train className="w-4 h-4 text-amber-400" />
              <span>Compounded Downstream Delay Predictions</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Train Number & Name</th>
                    <th className="pb-3 font-semibold">Scheduled Halt Time</th>
                    <th className="pb-3 font-semibold text-right">Predicted Compounded Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {result.potentiallyAffectedTrains.map((t: any) => (
                    <tr key={t.trainNumber} className="hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-200">
                        <span className="font-mono text-cyan-400 mr-2">{t.trainNumber}</span>
                        {t.trainName}
                      </td>
                      <td className="py-3 text-slate-300 font-mono">{t.scheduledHalt}</td>
                      <td className="py-3 text-right">
                        <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          +{t.estimatedCompoundedDelay} mins
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modeling Assumptions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Operational Simulation Assumptions</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              {result.assumptions.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 font-mono">
              {result.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
