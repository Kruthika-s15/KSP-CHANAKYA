'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Camera, Siren, Radio, ShieldCheck, X, Eye, AlertTriangle } from 'lucide-react';

/* ================================================================== */
/*  RASTER STYLE — guaranteed dark tiles                               */
/* ================================================================== */
const RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22 }],
};

/* ================================================================== */
/*  CCTV NODES                                                         */
/* ================================================================== */
const CCTV_NODES = [
  { id: 'CAM-MJ-014', lng: 77.5713, lat: 12.9767, name: 'Majestic Junction', jurisdiction: 'Central HQ', status: 'Active' },
  { id: 'CAM-VS-002', lng: 77.5912, lat: 12.9794, name: 'Vidhana Soudha', jurisdiction: 'Central HQ', status: 'Active' },
  { id: 'CAM-MG-021', lng: 77.6045, lat: 12.9758, name: 'MG Road', jurisdiction: 'MG Road PS', status: 'Warning' },
  { id: 'CAM-CM-009', lng: 77.5771, lat: 12.9634, name: 'City Market', jurisdiction: 'Central HQ', status: 'Active' },
  { id: 'CAM-RH-017', lng: 77.5990, lat: 12.9635, name: 'Richmond Circle', jurisdiction: 'MG Road PS', status: 'Active' },
  { id: 'CAM-KR-005', lng: 77.6229, lat: 12.9352, name: 'Koramangala 5th Block', jurisdiction: 'Koramangala PS', status: 'Active' },
  { id: 'CAM-WF-003', lng: 77.7499, lat: 12.9698, name: 'Whitefield ITPL', jurisdiction: 'Whitefield PS', status: 'Warning' },
];

/* ================================================================== */
/*  JURISDICTION POLYGON BOUNDARIES (simplified convex hulls)          */
/* ================================================================== */
const JURISDICTIONS: { name: string; color: string; coords: [number, number][] }[] = [
  {
    name: 'Central HQ',
    color: 'rgba(239, 68, 68, 0.12)',
    coords: [
      [77.560, 12.985], [77.595, 12.990], [77.600, 12.975],
      [77.595, 12.955], [77.570, 12.950], [77.555, 12.965], [77.560, 12.985],
    ],
  },
  {
    name: 'MG Road PS',
    color: 'rgba(59, 130, 246, 0.12)',
    coords: [
      [77.595, 12.985], [77.620, 12.985], [77.625, 12.970],
      [77.615, 12.955], [77.595, 12.955], [77.595, 12.985],
    ],
  },
  {
    name: 'Koramangala PS',
    color: 'rgba(168, 85, 247, 0.12)',
    coords: [
      [77.610, 12.950], [77.640, 12.950], [77.645, 12.925],
      [77.630, 12.915], [77.605, 12.920], [77.610, 12.950],
    ],
  },
  {
    name: 'Whitefield PS',
    color: 'rgba(245, 158, 11, 0.12)',
    coords: [
      [77.720, 12.985], [77.770, 12.985], [77.775, 12.960],
      [77.765, 12.945], [77.725, 12.950], [77.720, 12.985],
    ],
  },
];

/* ================================================================== */
/*  PATROL UNITS                                                       */
/* ================================================================== */
const PATROL_UNITS = [
  { id: 'PCR-11', lng: 77.5800, lat: 12.9800, name: 'Hoysala PCR-11' },
  { id: 'PCR-22', lng: 77.6300, lat: 12.9400, name: 'Hoysala PCR-22' },
  { id: 'PCR-33', lng: 77.7400, lat: 12.9750, name: 'Hoysala PCR-33' },
];

/* ================================================================== */
/*  FEED EVENTS                                                        */
/* ================================================================== */
const FEED_EVENTS = [
  'Motion detected — routine pedestrian flow',
  'Vehicle plate scan — no watchlist match',
  'Crowd density nominal — below threshold',
  'Loitering flagged — low confidence, auto-dismissed',
  'Feed re-synced after micro-dropout, signal restored',
  'Perimeter zone clear — no anomaly',
  'Night-mode activated — IR scan engaged',
];

/* ================================================================== */
/*  HELPERS                                                             */
/* ================================================================== */
function haversine(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function makeDomEl(className: string, innerHTML?: string) {
  const d = document.createElement('div');
  d.className = className;
  if (innerHTML) d.innerHTML = innerHTML;
  return d;
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
type GeoCase = {
  CaseMasterID?: string | number;
  latitude?: number;
  longitude?: number;
  CrimeHead?: string;
  PoliceStationName?: string;
  CaseStatus?: string;
};

export default function CityTwinMap({ cases }: { cases: GeoCase[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [selectedCam, setSelectedCam] = useState<typeof CCTV_NODES[0] | null>(null);
  const [log, setLog] = useState<{ id: number; text: string; cam: string }[]>([]);
  const [dispatchCard, setDispatchCard] = useState<{
    unit: string;
    target: string;
    jurisdiction: string;
    eta: number;
  } | null>(null);
  const idRef = useRef(0);

  /* ---------- build map ------------------------------------------ */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: RASTER_STYLE,
      center: [77.5946, 12.9716],
      zoom: 13.5,
      pitch: 50,
      bearing: -20,
      antialias: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      /* ---- jurisdiction polygon fills ---- */
      JURISDICTIONS.forEach((j, i) => {
        const srcId = `jurisdiction-${i}`;
        map.addSource(srcId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: j.name },
            geometry: { type: 'Polygon', coordinates: [j.coords] },
          },
        });
        map.addLayer({
          id: `${srcId}-fill`,
          type: 'fill',
          source: srcId,
          paint: { 'fill-color': j.color, 'fill-opacity': 0.6 },
        });
        map.addLayer({
          id: `${srcId}-outline`,
          type: 'line',
          source: srcId,
          paint: { 'line-color': j.color.replace(/[\d.]+\)$/, '0.6)'), 'line-width': 2, 'line-dasharray': [4, 3] },
        });
      });

      /* ---- 3D building extrusion (simulated from polygons) ---- */
      const buildingBlocks = [
        { coords: [[77.5935,12.9725],[77.5955,12.9725],[77.5955,12.9710],[77.5935,12.9710],[77.5935,12.9725]], h: 40 },
        { coords: [[77.5960,12.9745],[77.5980,12.9745],[77.5980,12.9730],[77.5960,12.9730],[77.5960,12.9745]], h: 60 },
        { coords: [[77.6035,12.9770],[77.6060,12.9770],[77.6060,12.9750],[77.6035,12.9750],[77.6035,12.9770]], h: 80 },
        { coords: [[77.6000,12.9660],[77.6020,12.9660],[77.6020,12.9640],[77.6000,12.9640],[77.6000,12.9660]], h: 50 },
        { coords: [[77.5780,12.9650],[77.5800,12.9650],[77.5800,12.9635],[77.5780,12.9635],[77.5780,12.9650]], h: 35 },
        { coords: [[77.6210,12.9370],[77.6240,12.9370],[77.6240,12.9345],[77.6210,12.9345],[77.6210,12.9370]], h: 55 },
        { coords: [[77.7480,12.9710],[77.7510,12.9710],[77.7510,12.9690],[77.7480,12.9690],[77.7480,12.9710]], h: 70 },
      ];
      map.addSource('buildings-3d', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: buildingBlocks.map((b) => ({
            type: 'Feature',
            properties: { height: b.h },
            geometry: { type: 'Polygon', coordinates: [b.coords] },
          })),
        },
      });
      map.addLayer({
        id: 'buildings-3d-layer',
        type: 'fill-extrusion',
        source: 'buildings-3d',
        paint: {
          'fill-extrusion-color': '#1e293b',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7,
        },
      });

      /* ---- dispatch route source ---- */
      map.addSource('dispatch-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'dispatch-route-line',
        type: 'line',
        source: 'dispatch-route',
        paint: {
          'line-color': '#ef4444',
          'line-width': 3,
          'line-dasharray': [2, 2],
          'line-opacity': 0.9,
        },
      });

      /* ---- case pins ---- */
      cases
        .filter((c) => c.latitude != null && c.longitude != null)
        .slice(0, 200)
        .forEach((c) => {
          const closed = c.CaseStatus?.toLowerCase().includes('closed');
          const el = makeDomEl(`map-dot ${closed ? 'map-dot-closed' : 'map-dot-open'}`);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([c.longitude!, c.latitude!])
            .setPopup(
              new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
                `<div class="map-popup"><strong>${c.CrimeHead || 'Case'}</strong><br/>${c.PoliceStationName || ''}<br/>${c.CaseStatus || ''}</div>`,
              ),
            )
            .addTo(map);
          markersRef.current.push(marker);
        });

      /* ---- CCTV camera markers ---- */
      CCTV_NODES.forEach((cam) => {
        const el = document.createElement('div');
        el.className = 'city-twin-cctv-marker';
        el.setAttribute('data-status', cam.status);
        el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
        el.addEventListener('click', () => setSelectedCam(cam));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cam.lng, cam.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      map.resize();
      setTimeout(() => map.resize(), 300);
      setReady(true);
    });

    // Fallback force-ready
    setTimeout(() => setReady(true), 800);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [cases]);

  /* ---------- simulated CCTV log feed ----------------------------- */
  useEffect(() => {
    const t = setInterval(() => {
      const cam = CCTV_NODES[Math.floor(Math.random() * CCTV_NODES.length)];
      const text = FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
      idRef.current += 1;
      setLog((prev) => [{ id: idRef.current, text, cam: `${cam.id} · ${cam.name}` }, ...prev].slice(0, 8));
    }, 2800);
    return () => clearInterval(t);
  }, []);

  /* ---------- SOS dispatch simulation ----------------------------- */
  const triggerSOS = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Pick a random CCTV node as the incident site
    const incident = CCTV_NODES[Math.floor(Math.random() * CCTV_NODES.length)];
    // Find nearest patrol unit
    const nearest = PATROL_UNITS.reduce((best, u) =>
      haversine(incident, u) < haversine(incident, best) ? u : best,
      PATROL_UNITS[0],
    );

    // SOS beacon marker
    const sosEl = makeDomEl('sos-beacon');
    const sosMarker = new maplibregl.Marker({ element: sosEl })
      .setLngLat([incident.lng, incident.lat])
      .addTo(map);

    // Patrol unit marker
    const patrolEl = makeDomEl('patrol-unit-marker', `<span>${nearest.id}</span>`);
    const patrolMarker = new maplibregl.Marker({ element: patrolEl })
      .setLngLat([nearest.lng, nearest.lat])
      .addTo(map);

    // Draw dispatch route line
    const routeSrc = map.getSource('dispatch-route') as maplibregl.GeoJSONSource | undefined;
    routeSrc?.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[nearest.lng, nearest.lat], [incident.lng, incident.lat]],
        },
      }],
    });

    // Fly to scene
    map.flyTo({ center: [incident.lng, incident.lat], zoom: 15, pitch: 55, duration: 1200 });

    // Show dispatch card
    const jurisdiction = incident.jurisdiction || 'Central';
    setDispatchCard({ unit: nearest.name, target: incident.name, jurisdiction, eta: 4 });

    // Log entry
    idRef.current += 1;
    setLog((prev) => [{
      id: idRef.current,
      text: `🚨 SOS TRIGGERED — ${nearest.name} dispatched to ${incident.name}`,
      cam: incident.id,
    }, ...prev].slice(0, 8));

    // Animate patrol unit moving toward incident
    const startTime = performance.now();
    const duration = 4000; // 4 seconds

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const lng = lerp(nearest.lng, incident.lng, t);
      const lat = lerp(nearest.lat, incident.lat, t);
      patrolMarker.setLngLat([lng, lat]);

      // Update the route line to show remaining path
      routeSrc?.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [[lng, lat], [incident.lng, incident.lat]],
          },
        }],
      });

      // Update ETA in dispatch card
      const remainingSecs = Math.ceil((1 - t) * 4);
      setDispatchCard((prev) => prev ? { ...prev, eta: remainingSecs } : null);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Arrived — clean up after a delay
        setTimeout(() => {
          sosMarker.remove();
          patrolMarker.remove();
          routeSrc?.setData({ type: 'FeatureCollection', features: [] });
          setDispatchCard(null);
        }, 3000);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  return (
    <div className="cmd-panel overflow-hidden min-h-[500px] h-full flex flex-col w-full relative">
      {/* ---- Header ---- */}
      <div className="p-4 flex items-center justify-between flex-wrap gap-2 shrink-0 border-b border-zinc-800 bg-zinc-900/80 z-20 relative">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Geospatial Command — 3D Basemap</p>
          <h2 className="font-semibold text-white flex items-center gap-2">3D City Twin — Bengaluru</h2>
        </div>
        <button
          onClick={triggerSOS}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors border border-red-400/50 shadow-[0_0_14px_rgba(239,68,68,0.4)]"
        >
          <Siren className="w-4 h-4" />
          Simulate SOS
        </button>
      </div>

      {/* ---- Body ---- */}
      <div className="flex-1 flex relative w-full overflow-hidden">
        {/* ---- Map ---- */}
        <div className="flex-1 relative h-full w-full bg-[#0a0a0a]">
          <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 font-data tracking-widest bg-black/80 z-10">
              LOADING BASEMAP…
            </div>
          )}

          {/* ---- Dispatch Card Overlay ---- */}
          {dispatchCard && (
            <div className="absolute top-4 left-4 z-30 bg-black/90 border-2 border-red-500 rounded-lg p-4 max-w-xs shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] uppercase font-data tracking-widest text-red-400">Emergency Dispatch</span>
              </div>
              <div className="text-white font-bold text-sm mb-1">
                {dispatchCard.unit} En Route
              </div>
              <div className="text-zinc-400 text-xs space-y-0.5">
                <div>Target: <span className="text-white">{dispatchCard.target}</span></div>
                <div>ETA: <span className="text-red-400 font-bold">{dispatchCard.eta} Min{dispatchCard.eta !== 1 ? 's' : ''}</span></div>
                <div>Jurisdiction: <span className="text-white">{dispatchCard.jurisdiction}</span></div>
              </div>
            </div>
          )}

          {/* ---- Bottom labels ---- */}
          <div className="absolute bottom-3 left-3 z-10 bg-black/60 border border-zinc-700 rounded px-2 py-1 pointer-events-none">
            <span className="font-data text-[10px] text-zinc-400">
              3D Extrusions · Jurisdiction Zones · CCTV + Dispatch Simulated
            </span>
          </div>
        </div>

        {/* ---- Right Panel: CCTV Drawer OR Feed ---- */}
        <div className="w-80 border-l border-zinc-800 flex flex-col h-full bg-zinc-950/90 backdrop-blur z-10 shrink-0">
          {selectedCam ? (
            /* ---- SELECTED CAMERA DETAIL DRAWER ---- */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Camera Detail
                </h3>
                <button onClick={() => setSelectedCam(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* simulated camera feed */}
              <div className="aspect-video bg-black border-b border-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <span className="text-xs text-zinc-500 font-data">LIVE FEED SIMULATION</span>
                  </div>
                </div>
                {/* scan line effect */}
                <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
                  <div className="w-full h-0.5 bg-emerald-500/80 absolute" style={{ animation: 'scanline 3s linear infinite' }} />
                </div>
                {/* timestamp */}
                <div className="absolute bottom-2 right-2 text-[10px] font-data text-red-400 bg-black/70 px-1.5 py-0.5 rounded">
                  ● REC
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-data tracking-wider">Camera ID</div>
                  <div className="text-sm text-white font-semibold">{selectedCam.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-data tracking-wider">Location</div>
                  <div className="text-sm text-white">{selectedCam.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-data tracking-wider">Jurisdiction</div>
                  <div className="text-sm text-white">{selectedCam.jurisdiction}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-data tracking-wider">Status</div>
                  <div className={`text-sm font-bold ${selectedCam.status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {selectedCam.status === 'Warning' ? '⚠ ANOMALY DETECTED' : '● FEED ACTIVE'}
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <div className="text-[10px] text-zinc-500 uppercase font-data tracking-wider mb-2">Recent Events</div>
                  {log.filter(l => l.cam.includes(selectedCam.id)).slice(0, 3).map(l => (
                    <div key={l.id} className="text-xs text-zinc-400 mb-1.5 pl-2 border-l border-zinc-700">
                      {l.text}
                    </div>
                  ))}
                  {log.filter(l => l.cam.includes(selectedCam.id)).length === 0 && (
                    <div className="text-xs text-zinc-600">No recent events for this camera.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ---- DEFAULT: LIVE CCTV FEED LOG ---- */
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider shrink-0">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                Simulated CCTV Feed
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {log.length === 0 && <p className="text-xs text-zinc-600 p-2">Awaiting simulated feed events…</p>}
                {log.map((l) => (
                  <div key={l.id} className="text-xs border border-red-500/15 rounded-md p-2 bg-black/20">
                    <div className="flex items-center gap-1.5 text-red-400 font-data text-[10px] tracking-wider mb-1">
                      <Camera className="w-3 h-3" /> {l.cam}
                    </div>
                    <div className="text-zinc-400">{l.text}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-data flex items-start gap-1.5 shrink-0">
                <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0 text-zinc-600" />
                Click a camera icon on the map to inspect its live feed and details.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Inline keyframes ---- */}
      <style>{`
        .city-twin-cctv-marker {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          border: 1.5px solid #10b981;
          border-radius: 50%;
          color: #10b981;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 15;
        }
        .city-twin-cctv-marker[data-status="Warning"] {
          border-color: #f59e0b;
          color: #f59e0b;
          animation: cctv-pulse 2s ease-in-out infinite;
        }
        .city-twin-cctv-marker:hover {
          transform: scale(1.2);
          border-color: #fff;
          color: #fff;
          box-shadow: 0 0 12px rgba(255,255,255,0.3);
        }
        .sos-beacon {
          width: 20px;
          height: 20px;
          background: #ef4444;
          border-radius: 50%;
          position: relative;
          z-index: 20;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
        }
        .sos-beacon::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(239, 68, 68, 0.8);
          animation: sos-ring 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .sos-beacon::after {
          content: '';
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          border: 1px solid rgba(239, 68, 68, 0.4);
          animation: sos-ring 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.3s;
        }
        .patrol-unit-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #1e3a5f;
          border: 2px solid #3b82f6;
          border-radius: 6px;
          z-index: 25;
          box-shadow: 0 0 14px rgba(59, 130, 246, 0.5);
        }
        .patrol-unit-marker span {
          font-size: 8px;
          font-weight: 800;
          color: #93c5fd;
          letter-spacing: 0.5px;
          font-family: monospace;
        }
        @keyframes sos-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes cctv-pulse {
          0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.3); }
          50% { box-shadow: 0 0 14px rgba(245, 158, 11, 0.7); }
        }
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
