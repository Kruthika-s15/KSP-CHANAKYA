'use client';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

const EVENTS = [
  { time: 'Just now', title: 'Suspicious Vehicle Activity', loc: 'Indiranagar 100ft Rd', level: 'high' },
  { time: '2m ago', title: 'Crowd Gathering Detected', loc: 'Majestic Bus Stand', level: 'med' },
  { time: '5m ago', title: 'Perimeter Breach Warning', loc: 'Vidhana Soudha Zone', level: 'critical' },
  { time: '12m ago', title: 'Traffic Anomaly', loc: 'Silk Board Junction', level: 'low' },
];

export default function IncidentFeed() {
  const [feed, setFeed] = useState(EVENTS.slice(1));

  useEffect(() => {
    const timer = setTimeout(() => {
      setFeed(EVENTS);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="cmd-panel overflow-hidden flex flex-col flex-1">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Live Dispatch Feed
        </h2>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>
      <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar h-[250px]">
        {feed.map((ev, i) => (
          <div key={i} className="pl-3 border-l-2 border-red-500/50 py-1 mb-2">
            <div className="flex justify-between items-start">
              <span className={`text-sm font-semibold ${ev.level === 'critical' ? 'text-red-400' : ev.level === 'high' ? 'text-amber-400' : 'text-zinc-200'}`}>
                {ev.title}
              </span>
              <span className="text-[10px] text-zinc-500 font-data whitespace-nowrap ml-2">{ev.time}</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 opacity-50" />
              {ev.loc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
