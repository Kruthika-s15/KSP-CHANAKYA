import { AlertTriangle, Activity, MapPin, Layers, Map } from 'lucide-react';
import { fetchCrimes } from '@/lib/api';
import OverviewRadarMap from '@/components/OverviewRadarMap';

export default async function DashboardHome() {
  let items = [];
  let totalCases = 0;
  
  try {
    const data = await fetchCrimes({ page: 1, page_size: 100 });
    items = data.items || [];
    totalCases = data.total || 0;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }

  const closedCases = items.filter((i: any) => i.CaseStatus?.toLowerCase().includes('closed')).length;
  const activeCases = totalCases - closedCases;
  
  // Aggregate categories
  const categoryCounts: Record<string, number> = {};
  items.forEach((item: any) => {
    const cat = item.CrimeHead || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
    
  const recentItems = items.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <p className="cmd-eyebrow mb-1">KSP // Karnataka State Police — Intelligence Command</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
          </div>
          <div className="cmd-tag flex items-center gap-1.5 text-emerald-400 border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Data Sync Active
          </div>
        </div>
        <div className="ascii-rule mt-3" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hud-stat group">
          <div className="flex items-start justify-between">
            <span className="cmd-eyebrow">Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="hud-value text-red-400 mt-2 glow-red">{String(activeCases).padStart(3, '0')}</div>
          <div className="hud-bar" style={{ background: 'linear-gradient(90deg, rgb(248 113 113), transparent)' }} />
        </div>
        <div className="hud-stat group">
          <div className="flex items-start justify-between">
            <span className="cmd-eyebrow">Total Cases</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="hud-value text-red-300 mt-2 glow-cyan">{String(totalCases).padStart(3, '0')}</div>
          <div className="hud-bar" />
        </div>
        <div className="hud-stat group">
          <div className="flex items-start justify-between">
            <span className="cmd-eyebrow">Closed Cases</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hud-value text-emerald-300 mt-2">{String(closedCases).padStart(3, '0')}</div>
          <div className="hud-bar" style={{ background: 'linear-gradient(90deg, rgb(52 211 153), transparent)' }} />
        </div>
        <div className="hud-stat group">
          <div className="flex items-start justify-between">
            <span className="cmd-eyebrow">Categories</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="hud-value text-purple-300 mt-2">{String(Object.keys(categoryCounts).length).padStart(3, '0')}</div>
          <div className="hud-bar" style={{ background: 'linear-gradient(90deg, rgb(192 132 252), transparent)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area - Map Placeholder */}
        <div className="lg:col-span-2 cmd-panel flex flex-col h-[520px] overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 z-20 relative">
            <h2 className="font-semibold text-white">Digital City Twin - Live Map</h2>
            <div className="flex space-x-2">
               <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
               <span className="text-xs text-zinc-400 uppercase tracking-wider">Live Intel</span>
            </div>
          </div>
          <div className="flex-1 w-full h-full relative z-0">
            <OverviewRadarMap />
          </div>
        </div>

        {/* Side Content Area */}
        <div className="space-y-6">
          {/* Recent Incidents */}
          <div className="cmd-panel overflow-hidden flex flex-col" style={{maxHeight: '300px'}}>
            <div className="p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h2 className="font-semibold text-white">Recent Incidents</h2>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {recentItems.length > 0 ? recentItems.map((item: any) => (
                <div key={item.CaseMasterID} className="flex items-start space-x-3 pb-3 border-b border-zinc-800/50 last:border-0 last:pb-0 group">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all"></div>
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">{item.CrimeHead || 'Unknown'}</div>
                    <div className="text-xs text-zinc-400 mt-1">{item.PoliceStationName} • {item.CrimeRegisteredDate}</div>
                  </div>
                </div>
              )) : (
                <div className="text-zinc-500 text-sm">No recent incidents.</div>
              )}
            </div>
          </div>

          {/* Crime Categories */}
          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Category Distribution</h2>
            </div>
            <div className="p-4 space-y-4">
              {topCategories.length > 0 ? topCategories.map(([cat, count], idx) => {
                const percent = Math.round((count / Math.max(1, totalCases)) * 100);
                const colors = ['bg-red-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];
                return (
                  <div key={cat} className="group">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="text-zinc-300 group-hover:text-white transition-colors">{cat}</span>
                      <span className="text-white font-medium">{percent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`${colors[idx % colors.length]} h-full rounded-full transform origin-left transition-transform duration-1000`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-zinc-500 text-sm">No category data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
