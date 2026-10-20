import React, { useState, useEffect } from 'react';
import { Search, Shield, Zap, ToggleLeft, ToggleRight, AlertCircle, Clock } from 'lucide-react';
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

  // Debounced search
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await Api.searchTrains(searchInput);
        if (resp.success && resp.data) {
          setSuggestions(resp.data.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (e) {
        // quiet
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchTrain(searchInput.trim());
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (trainNum: string) => {
    setSearchInput(trainNum);
    onSearchTrain(trainNum);
    setShowSuggestions(false);
  };

  return (
    <header className="h-16 bg-[#0d1629] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Quick Train Search */}
      <div className="relative w-96">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            placeholder="Search train (e.g. 12951, 22436, Shatabdi)..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
            {suggestions.map((t: any) => (
              <button
                key={t.trainNumber}
                onClick={() => handleSelectSuggestion(t.trainNumber)}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/60 last:border-0 text-xs"
              >
                <div>
                  <span className="font-bold text-cyan-400 mr-2">{t.trainNumber}</span>
                  <span className="text-slate-200">{t.trainName}</span>
                </div>
                <span className="text-[10px] text-slate-500">{t.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: IST Clock & Mode Badges */}
      <div className="flex items-center gap-4">
        {/* IST Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{istTime} IST</span>
        </div>

        {/* DEMO MODE Status Indicator */}
        <div className="flex items-center gap-2">
          {demoMode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-600/40">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>DEMO MODE ACTIVE</span>
              <span className="text-[10px] text-amber-500">(Quota Safe)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE API READY</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
