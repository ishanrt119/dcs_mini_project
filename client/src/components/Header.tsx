import React, { useState, useEffect } from 'react';
import { Search, Shield, Zap, ToggleLeft, ToggleRight, AlertCircle, Clock, Radio } from 'lucide-react';
import { Api } from '../api';

interface Props {
  onSearchTrain: (trainNumber: string) => void;
  demoMode: boolean;
  liveApiEnabled: boolean;
  onModeChanged: () => void;
}

export const Header: React.FC<Props> = ({ onSearchTrain, demoMode, liveApiEnabled, onModeChanged }) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [istTime, setIstTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setIstTime(istString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchTrain(searchInput.trim());
    }
  };

  return (
    <header className="h-16 bg-[#0d1629] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Quick Train Search */}
      <div className="relative w-96">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Search train (e.g. 12951, 12952, 22436)..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-14 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-semibold transition-all"
          >
            Track
          </button>
        </form>
      </div>

      {/* Center Notice Banner */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-600/30 text-emerald-300 text-xs shadow-inner">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold tracking-wide">Live Railway API</span>
        <span className="text-slate-400 text-[11px]">— High-Throughput Distributed Rail Intelligence Active</span>
      </div>

      {/* Right Controls: IST Clock & Mode Badges */}
      <div className="flex items-center gap-4">
        {/* IST Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{istTime} IST</span>
        </div>

        {/* LIVE API Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE API</span>
            <span className="text-[10px] text-emerald-400 font-mono">(Connected)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
