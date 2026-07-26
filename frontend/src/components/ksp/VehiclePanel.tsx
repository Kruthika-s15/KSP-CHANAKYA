'use client';
import { Car, Navigation2 } from 'lucide-react';

export default function VehiclePanel() {
  const units = [
    { id: 'PCR-11', status: 'Patrolling', location: 'MG Road Sector', speed: '32 km/h' },
    { id: 'PCR-44', status: 'En Route', location: 'Whitefield', speed: '55 km/h' },
    { id: 'INT-09', status: 'Stationary', location: 'Central HQ', speed: '0 km/h' },
  ];

  return (
    <div className="cmd-panel overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-400" />
          Active Patrol Units
        </h2>
        <span className="text-[10px] text-zinc-400 font-data tracking-wider">HOYSALA FLEET</span>
      </div>
      <div className="p-4 space-y-3">
        {units.map(u => (
          <div key={u.id} className="p-3 border border-zinc-800/60 rounded bg-zinc-900/40 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white font-data tracking-wider">{u.id}</span>
              <span className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                <Navigation2 className="w-3 h-3" /> {u.location}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.status === 'Patrolling' ? 'bg-emerald-500/20 text-emerald-400' : u.status === 'En Route' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                {u.status}
              </span>
              <span className="text-[10px] text-zinc-500 font-data mt-1">{u.speed}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
