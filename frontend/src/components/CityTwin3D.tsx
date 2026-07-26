'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Siren, Radio } from 'lucide-react';

// Abstract building footprint for a Bengaluru-style skyline. Purely a
// stylised CSS 3D block layout (x%, y%, footprint size, height) — not a
// literal survey of real buildings. Landmarks are labelled loosely by
// well-known KSP-relevant zones for orientation only.
const BUILDINGS = [
  { x: 18, y: 60, w: 8, h: 34, label: 'Majestic' },
  { x: 28, y: 48, w: 7, h: 58, label: 'City Market' },
  { x: 40, y: 62, w: 9, h: 26 },
  { x: 50, y: 40, w: 8, h: 72, label: 'Vidhana Soudha' },
  { x: 62, y: 55, w: 7, h: 44 },
  { x: 34, y: 30, w: 6, h: 22 },
  { x: 70, y: 35, w: 8, h: 30, label: 'MG Road' },
  { x: 20, y: 32, w: 6, h: 18 },
  { x: 58, y: 68, w: 9, h: 20 },
  { x: 78, y: 55, w: 7, h: 40 },
  { x: 45, y: 20, w: 6, h: 16 },
  { x: 82, y: 32, w: 6, h: 24 },
];

const CCTV_NODES = [
  { x: 18, y: 60, name: 'CAM-KR-014 · Majestic Junction' },
  { x: 50, y: 40, name: 'CAM-VS-002 · Vidhana Soudha' },
  { x: 70, y: 35, name: 'CAM-MG-021 · MG Road' },
  { x: 28, y: 48, name: 'CAM-CM-009 · City Market' },
  { x: 62, y: 55, name: 'CAM-RH-017 · Richmond Circle' },
];

const FEED_EVENTS = [
  'Motion detected — routine pedestrian flow',
  'Vehicle plate scan — no watchlist match',
  'Crowd density nominal',
  'Loitering flagged — low confidence, auto-dismissed',
  'Feed re-synced, signal restored',
  'Night vision engaged',
];

export default function CityTwin3D() {
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<{ id: number; text: string; cam: string }[]>([]);
  const [sos, setSos] = useState<{ id: number; x: number; y: number } | null>(null);
  const idRef = useRef(0);

  // simulated "realtime" camera feed ticker
  useEffect(() => {
    const t = setInterval(() => {
      setTick((v) => v + 1);
      const cam = CCTV_NODES[Math.floor(Math.random() * CCTV_NODES.length)];
      const text = FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
      idRef.current += 1;
      setLog((prev) => [{ id: idRef.current, text, cam: cam.name }, ...prev].slice(0, 6));
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const triggerSOS = () => {
    const node = CCTV_NODES[Math.floor(Math.random() * CCTV_NODES.length)];
    idRef.current += 1;
    const alertId = idRef.current;
    setSos({ id: alertId, x: node.x, y: node.y });
    setLog((prev) => [
      { id: idRef.current, text: `SOS TRIGGERED — nearest unit dispatched`, cam: node.name },
      ...prev,
    ].slice(0, 6));
    setTimeout(() => setSos((cur) => (cur?.id === alertId ? null : cur)), 4200);
  };

  return (
    <div className="cmd-panel overflow-hidden">
      <div className="cmd-panel-header p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Simulated Visualization Layer</p>
          <h2 className="font-semibold text-white flex items-center gap-2">
            3D City Twin — Bengaluru
          </h2>
        </div>
        <button
          onClick={triggerSOS}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600/90 hover:bg-red-500 text-white transition-colors border border-red-400/50 shadow-[0_0_14px_rgba(239,68,68,0.4)]"
        >
          <Siren className="w-3.5 h-3.5" />
          Simulate SOS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Scene */}
        <div className="lg:col-span-2 relative iso-scene h-[380px] bg-black/30 overflow-hidden">
          <div className="absolute inset-0 hex-grid opacity-30" />
          <div
            className="iso-ground absolute"
            style={{ left: '50%', top: '58%', width: '560px', height: '360px', marginLeft: '-280px', marginTop: '-180px' }}
          >
            {/* ground plane */}
            <div className="absolute inset-0 border border-red-500/15 bg-red-500/[0.02]" />

            {BUILDINGS.map((b, i) => (
              <div
                key={i}
                className="iso-block"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}%`,
                  height: `${b.w}%`,
                  transform: `translateZ(${b.h}px)`,
                }}
                title={b.label}
              />
            ))}

            {CCTV_NODES.map((c, i) => (
              <div
                key={i}
                className="cctv-dot"
                style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translateZ(90px)' }}
                title={c.name}
              />
            ))}

            {sos && (
              <div
                className="sos-burst"
                style={{ left: `${sos.x}%`, top: `${sos.y}%`, transform: 'translateZ(90px)' }}
              />
            )}
          </div>

          <div className="absolute bottom-3 left-3 font-data text-[10px] text-zinc-500 tracking-widest">
            SIMULATED RENDER · NOT A LIVE FEED · FRAME {tick}
          </div>
        </div>

        {/* Live feed panel */}
        <div className="border-t lg:border-t-0 lg:border-l border-[var(--line)] flex flex-col min-h-[380px]">
          <div className="px-4 py-3 border-b border-[var(--line)] flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            Simulated CCTV Feed
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {log.length === 0 && (
              <p className="text-xs text-zinc-600 p-2">Awaiting simulated feed events…</p>
            )}
            {log.map((l) => (
              <div key={l.id} className="text-xs border border-red-500/15 rounded-md p-2 bg-black/20">
                <div className="flex items-center gap-1.5 text-red-400 font-data text-[10px] tracking-wider mb-1">
                  <Camera className="w-3 h-3" /> {l.cam}
                </div>
                <div className="text-zinc-400">{l.text}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-[var(--line)] text-[10px] text-zinc-600 font-data">
            This panel is a simulation for demo purposes — it is not wired to real camera hardware.
          </div>
        </div>
      </div>
    </div>
  );
}
