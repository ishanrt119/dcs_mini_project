import React, { useState } from 'react';
import { API_REGISTRY, ApiRegistryEntry } from '../../../shared/registry';
import { SourceBadge } from '../components/SourceBadge';
import { BookOpen, Search, Filter, ShieldCheck, CheckCircle2, Cpu, Clock } from 'lucide-react';

export const ApiRegistryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const modules = [
    'ALL',
    'Train Intelligence',
    'Journey Planning',
    'Reservation Intelligence',
    'Network & Specialist Data'
  ];

  const filtered = API_REGISTRY.filter(item => {
    const matchesModule = selectedModule === 'ALL' || item.featureModule === selectedModule;
    const matchesSearch =
      item.displayName.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.documentedPath.toLowerCase().includes(search.toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>Centralized API Registry Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable registry of all 34 documented RailRadar and internal distributed services endpoints.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          {API_REGISTRY.length} Cataloged Endpoints
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedModule === mod
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter endpoint..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="p-4 font-semibold">Identifier & Name</th>
                <th className="p-4 font-semibold">Documented Path</th>
                <th className="p-4 font-semibold">Module</th>
                <th className="p-4 font-semibold">TTL Cache</th>
                <th className="p-4 font-semibold">Quota Impact</th>
                <th className="p-4 font-semibold text-right">Adapter Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filtered.map(ep => (
                <tr key={ep.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-medium text-slate-200">
                    <div className="font-bold text-white text-xs">{ep.displayName}</div>
                    <div className="font-mono text-cyan-400 text-[10px] mt-0.5">{ep.id}</div>
                  </td>

                  <td className="p-4 font-mono text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold mr-2 text-[10px]">
                      {ep.httpMethod}
                    </span>
                    <span className="text-slate-300">{ep.documentedPath}</span>
                  </td>

                  <td className="p-4 text-slate-400">{ep.featureModule}</td>

                  <td className="p-4 font-mono text-slate-400">
                    {ep.defaultTtlSeconds >= 86400
                      ? `${ep.defaultTtlSeconds / 86400}d`
                      : ep.defaultTtlSeconds >= 3600
                      ? `${ep.defaultTtlSeconds / 3600}h`
                      : `${ep.defaultTtlSeconds}s`}
                  </td>

                  <td className="p-4">
                    {ep.consumesQuota ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-semibold text-[10px] border border-amber-800">
                        Consumes Quota
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        Zero Quota
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {ep.implementationStatus === 'verified_live' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Live</span>
                      </span>
                    ) : ep.implementationStatus === 'fixture_adapter' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Fixture Adapter</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Spec</span>
                      </span>
                    )}
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
