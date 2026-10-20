import React from 'react';
import { DataSourceLabel } from '../types';
import { Radio, Database, History, Cpu, AlertTriangle } from 'lucide-react';

interface Props {
  source?: DataSourceLabel;
  isCached?: boolean;
  ttlRemaining?: number;
}

export const SourceBadge: React.FC<Props> = ({ source = 'SIMULATED_DEMO_DATA', isCached, ttlRemaining }) => {
  switch (source) {
    case 'LIVE_PROVIDER_DATA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Radio className="w-3.5 h-3.5" />
          LIVE PROVIDER DATA
        </span>
      );

    case 'CACHED_PROVIDER_DATA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
          <Database className="w-3.5 h-3.5" />
          CACHED PROVIDER DATA
          {ttlRemaining !== undefined && <span className="opacity-75 text-[10px]">({ttlRemaining}s TTL)</span>}
        </span>
      );

    case 'LOCAL_HISTORICAL_OBSERVATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30">
          <History className="w-3.5 h-3.5" />
          LOCAL HISTORICAL OBSERVATION
        </span>
      );

    case 'SIMULATED_DEMO_DATA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
          <Cpu className="w-3.5 h-3.5" />
          SIMULATED DEMO DATA
        </span>
      );

    case 'UNAVAILABLE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          SERVICE UNAVAILABLE
        </span>
      );
  }
};
