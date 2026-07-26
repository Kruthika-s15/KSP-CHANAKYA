import { fetchCatalystStatus, fetchCatalystHotspots, fetchCatalystNotifications } from '@/lib/api';
import { Layers, CheckCircle2, FlaskConical, PlugZap, Flame, Bell } from 'lucide-react';

const TIER_META: Record<string, { label: string; color: string; icon: any }> = {
  implemented: { label: 'Implemented', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  simulated_local: { label: 'Simulated Locally', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: FlaskConical },
  integration_ready: { label: 'Integration-Ready', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30', icon: PlugZap },
};

export default async function CatalystPage() {
  const [status, hotspots, notifications] = await Promise.all([
    fetchCatalystStatus().catch(() => null),
    fetchCatalystHotspots().catch(() => []),
    fetchCatalystNotifications().catch(() => []),
  ]);

  const services: any[] = status?.services || [];
  const byCategory: Record<string, any[]> = {};
  for (const s of services) {
    byCategory[s.category] = byCategory[s.category] || [];
    byCategory[s.category].push(s);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <p className="cmd-eyebrow mb-1">KSP // Platform Infrastructure</p>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Layers className="w-6 h-6 mr-3 text-red-500" />
          Catalyst Platform Services
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          How each required platform service maps onto this project today — implemented and live,
          simulated locally with a real fallback, or integration-ready pending credentials.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(TIER_META).map(([key, meta]) => (
            <div key={key} className={`border rounded-lg p-4 ${meta.color}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <meta.icon className="w-4 h-4" />
                {meta.label}
              </div>
              <div className="text-2xl font-bold mt-1 font-data">{status.summary?.[key] ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      {!status && (
        <div className="cmd-panel p-6 text-zinc-500 text-center">
          Could not reach the Catalyst status API. Is the backend running?
        </div>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="cmd-panel p-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">{category}</h2>
          <div className="space-y-3">
            {items.map((s) => {
              const meta = TIER_META[s.tier] || TIER_META.integration_ready;
              return (
                <div key={s.key} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-medium text-white text-sm">{s.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{s.description}</p>
                  <div className="text-[11px] text-zinc-500 mt-2 space-y-0.5">
                    <div><span className="text-zinc-600">Local provider:</span> {s.local_provider}</div>
                    <div><span className="text-zinc-600">Catalyst equivalent:</span> {s.catalyst_equivalent}</div>
                    {s.demo_endpoint && (
                      <div><span className="text-zinc-600">Demo:</span> <code className="text-red-400">{s.demo_endpoint}</code></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4">
        <div className="cmd-panel p-4">
          <h2 className="text-sm font-semibold text-zinc-300 flex items-center mb-3">
            <Flame className="w-4 h-4 mr-2 text-orange-400" /> Live Hotspot Scores
          </h2>
          {hotspots.length === 0 ? (
            <div className="text-xs text-zinc-500">No hotspot data available.</div>
          ) : (
            <div className="space-y-2">
              {hotspots.map((h: any) => (
                <div key={h.label} className="flex justify-between text-xs">
                  <span className="text-zinc-300">{h.label} <span className="text-zinc-600">({h.district})</span></span>
                  <span className="text-orange-400 font-mono">{h.hotspot_score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cmd-panel p-4">
          <h2 className="text-sm font-semibold text-zinc-300 flex items-center mb-3">
            <Bell className="w-4 h-4 mr-2 text-red-400" /> Recent Notification Log
          </h2>
          {notifications.length === 0 ? (
            <div className="text-xs text-zinc-500">No notifications yet — change a case status to trigger one.</div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any, i: number) => (
                <div key={i} className="text-xs text-zinc-400 border-l-2 border-zinc-700 pl-2">
                  <span className="text-zinc-300">[{n.channel}]</span> {n.subject}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
