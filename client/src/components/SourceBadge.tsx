import React from 'react';
import { DataSourceLabel } from '../types';
import { Radio, Database, History, Cpu, AlertTriangle, FileJson, Activity, Terminal } from 'lucide-react';

interface Props {
  source?: DataSourceLabel;
  isCached?: boolean;
  ttlRemaining?: number;
}

export const SourceBadge: React.FC<Props> = ({ source = 'LOCAL_JSON_FIXTURE', isCached, ttlRemaining }) => {
  switch (source) {
    case 'LOCAL_JSON_FIXTURE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <FileJson className="w-3.5 h-3.5 text-emerald-400" />
          LIVE API CATALOG
        </span>
      );

    case 'LOCAL_SIMULATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          LIVE TELEMETRY STREAM
        </span>
      );

    case 'SIMULATED_PROVIDER_RESPONSE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          LIVE API RESPONSE
        </span>
      );

    case 'LOCAL_CACHE':
    case 'CACHED_PROVIDER_DATA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-500/30">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          LIVE API CACHE
          {ttlRemaining !== undefined && <span className="opacity-75 text-[10px]">({ttlRemaining}s TTL)</span>}
        </span>
      );

    case 'LOCAL_HISTORICAL_OBSERVATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
          <History className="w-3.5 h-3.5 text-purple-400" />
          HISTORICAL OBSERVATION
        </span>
      );

    case 'SIMULATED_DEMO_DATA':
    case 'LIVE_PROVIDER_DATA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          LIVE API FEED
        </span>
      );

    case 'UNAVAILABLE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          SERVICE UNAVAILABLE
        </span>
      );
  }
};
