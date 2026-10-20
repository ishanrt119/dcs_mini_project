import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Train,
  Compass,
  ArrowRightLeft,
  Building2,
  Clock,
  MapPin,
  Ticket,
  Calculator,
  Search,
  Percent,
  Receipt,
  Layers,
  LineChart,
  FolderTree,
  TramFront,
  Flame,
  Activity,
  ShieldAlert,
  BookOpen
} from 'lucide-react';

export type NavView =
  | 'overview'
  | 'live-train'
  | 'train-details'
  | 'coach-platform'
  | 'network-map'
  | 'journey-planner'
  | 'trains-between'
  | 'station-explorer'
  | 'live-departures'
  | 'seat-availability'
  | 'fare-calculator'
  | 'pnr-status'
  | 'confirmation-prediction'
  | 'cancellation-refund'
  | 'delay-analytics'
  | 'directories'
  | 'suburban-freight'
  | 'disruption-sim'
  | 'distributed-monitor'
  | 'quota-dashboard'
  | 'api-registry';

interface SidebarItem {
  id: NavView;
  label: string;
  icon: any;
  highlight?: boolean;
  dcs?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface Props {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  clusterHealth?: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  quotaRemaining?: number;
}

export const Sidebar: React.FC<Props> = ({ currentView, onSelectView, clusterHealth = 'HEALTHY', quotaRemaining = 80 }) => {
  const sections: SidebarSection[] = [
    {
      title: 'OPERATIONS & TRACKING',
      items: [
        { id: 'overview' as NavView, label: 'Overview', icon: LayoutDashboard },
        { id: 'live-train' as NavView, label: 'Live Train Status', icon: Radio, highlight: true },
        { id: 'train-details' as NavView, label: 'Train Details & Halts', icon: Train },
        { id: 'coach-platform' as NavView, label: 'Coach & Platform', icon: Layers },
        { id: 'network-map' as NavView, label: 'Railway Map Feed', icon: MapPin }
      ]
    },
    {
      title: 'JOURNEY PLANNING',
      items: [
        { id: 'journey-planner' as NavView, label: 'Route Planner', icon: Compass },
        { id: 'trains-between' as NavView, label: 'Trains Between', icon: ArrowRightLeft },
        { id: 'station-explorer' as NavView, label: 'Station Explorer', icon: Building2 },
        { id: 'live-departures' as NavView, label: 'Live Departures', icon: Clock }
      ]
    },
    {
      title: 'RESERVATION INTELLIGENCE',
      items: [
        { id: 'seat-availability' as NavView, label: 'Seat Availability', icon: Ticket },
        { id: 'fare-calculator' as NavView, label: 'Fare Calculator', icon: Calculator },
        { id: 'pnr-status' as NavView, label: 'PNR Status Lookup', icon: Search },
        { id: 'confirmation-prediction' as NavView, label: 'Waitlist Prediction', icon: Percent },
        { id: 'cancellation-refund' as NavView, label: 'Refund Estimation', icon: Receipt }
      ]
    },
    {
      title: 'NETWORK & SPECIALIST',
      items: [
        { id: 'delay-analytics' as NavView, label: 'Delay Analytics', icon: LineChart },
        { id: 'directories' as NavView, label: 'Master Directories', icon: FolderTree },
        { id: 'suburban-freight' as NavView, label: 'Suburban & Freight', icon: TramFront },
        { id: 'disruption-sim' as NavView, label: 'Disruption Simulator', icon: Flame }
      ]
    },
    {
      title: 'DCS DISTRIBUTED SYSTEM',
      items: [
        { id: 'distributed-monitor' as NavView, label: 'Cluster & Fault Demo', icon: Activity, dcs: true },
        { id: 'quota-dashboard' as NavView, label: 'API Quota Manager', icon: ShieldAlert },
        { id: 'api-registry' as NavView, label: 'API Registry Catalog', icon: BookOpen }
      ]
    }
  ];

  return (
    <aside className="w-64 min-w-[16rem] bg-[#0b1324] border-r border-slate-800 flex flex-col h-screen select-none sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Train className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">RailSync</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">DCS</span>
            </div>
            <p className="text-[11px] text-slate-400">Distributed Intelligence</p>
          </div>
        </div>
      </div>

      {/* Cluster Health Pill */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${clusterHealth === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : clusterHealth === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
          <span className="text-slate-300 font-medium">Cluster: {clusterHealth}</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Quota: <span className="text-cyan-400 font-semibold">{quotaRemaining}</span>/80
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{sec.title}</p>
            {sec.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.dcs && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">DCS</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Persistent Quota Warning Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-300 font-medium">Monthly Safe Budget</span>
          <span className="font-mono text-cyan-400">{quotaRemaining} left</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (quotaRemaining / 80) * 100)}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">20 emergency reserve calls held.</p>
      </div>
    </aside>
  );
};
