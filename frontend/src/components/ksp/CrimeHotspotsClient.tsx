'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Filter, Flame, Clock, Shield, X, ChevronDown } from 'lucide-react';

/* ================================================================== */
/*  TYPES & CONSTANTS                                                  */
/* ================================================================== */

type Station = {
  id: string;
  name: string;
  color: string;
  boundary: [number, number][]; // Leaflet uses [lat, lng]
  patrols: [number, number][];
};

// Bengaluru Center for Leaflet
const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

const STATIONS: Station[] = [
  {
    id: 'cubbon-park',
    name: 'Cubbon Park Station',
    color: '#06b6d4', // Cyan
    boundary: [
      [12.984, 77.580], [12.984, 77.606], [12.968, 77.608],
      [12.960, 77.600], [12.962, 77.578], [12.972, 77.575], [12.984, 77.580]
    ],
    patrols: [[12.975, 77.592], [12.970, 77.598], [12.978, 77.585]],
  },
  {
    id: 'halasuru',
    name: 'Halasuru (Ulsoor) Station',
    color: '#eab308', // Yellow/Gold
    boundary: [
      [12.990, 77.610], [12.990, 77.630], [12.975, 77.635],
      [12.968, 77.625], [12.972, 77.610], [12.990, 77.610]
    ],
    patrols: [[12.982, 77.620], [12.975, 77.625]],
  },
  {
    id: 'koramangala',
    name: 'Koramangala Station',
    color: '#3b82f6', // Blue
    boundary: [
      [12.948, 77.608], [12.948, 77.642], [12.924, 77.645],
      [12.916, 77.632], [12.920, 77.606], [12.948, 77.608]
    ],
    patrols: [[12.935, 77.622], [12.930, 77.630], [12.940, 77.615]],
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar Station',
    color: '#a855f7', // Purple
    boundary: [
      [12.990, 77.635], [12.990, 77.660], [12.962, 77.662],
      [12.960, 77.635], [12.990, 77.635]
    ],
    patrols: [[12.980, 77.645], [12.970, 77.640]],
  },
];

type MockCrime = {
  id: string;
  lat: number;
  lng: number;
  category: string;
  hoursAgo: number;
  stationId: string;
};

// Random incidents spread around the jurisdictions
const MOCK_INCIDENTS: MockCrime[] = [
  // Cubbon Park
  { id: 'C1', lat: 12.977, lng: 77.592, category: 'Robbery', hoursAgo: 2, stationId: 'cubbon-park' },
  { id: 'C2', lat: 12.975, lng: 77.595, category: 'Chain Snatching', hoursAgo: 5, stationId: 'cubbon-park' },
  { id: 'C3', lat: 12.978, lng: 77.590, category: 'Vehicle Theft', hoursAgo: 12, stationId: 'cubbon-park' },
  { id: 'C4', lat: 12.972, lng: 77.598, category: 'Cyber Fraud', hoursAgo: 22, stationId: 'cubbon-park' },
  { id: 'C5', lat: 12.974, lng: 77.585, category: 'Robbery', hoursAgo: 48, stationId: 'cubbon-park' },
  { id: 'C6', lat: 12.965, lng: 77.595, category: 'Chain Snatching', hoursAgo: 7, stationId: 'cubbon-park' },
  { id: 'C7', lat: 12.980, lng: 77.588, category: 'Vehicle Theft', hoursAgo: 1, stationId: 'cubbon-park' },
  { id: 'C8', lat: 12.971, lng: 77.602, category: 'Robbery', hoursAgo: 30, stationId: 'cubbon-park' },

  // Halasuru
  { id: 'H1', lat: 12.985, lng: 77.620, category: 'Cyber Fraud', hoursAgo: 3, stationId: 'halasuru' },
  { id: 'H2', lat: 12.975, lng: 77.625, category: 'Vehicle Theft', hoursAgo: 15, stationId: 'halasuru' },
  { id: 'H3', lat: 12.980, lng: 77.615, category: 'Robbery', hoursAgo: 6, stationId: 'halasuru' },
  { id: 'H4', lat: 12.978, lng: 77.628, category: 'Chain Snatching', hoursAgo: 120, stationId: 'halasuru' },
  { id: 'H5', lat: 12.988, lng: 77.612, category: 'Cyber Fraud', hoursAgo: 1, stationId: 'halasuru' },
  { id: 'H6', lat: 12.972, lng: 77.622, category: 'Chain Snatching', hoursAgo: 8, stationId: 'halasuru' },

  // Koramangala
  { id: 'K1', lat: 12.935, lng: 77.622, category: 'Vehicle Theft', hoursAgo: 2, stationId: 'koramangala' },
  { id: 'K2', lat: 12.940, lng: 77.615, category: 'Robbery', hoursAgo: 10, stationId: 'koramangala' },
  { id: 'K3', lat: 12.930, lng: 77.630, category: 'Cyber Fraud', hoursAgo: 4, stationId: 'koramangala' },
  { id: 'K4', lat: 12.945, lng: 77.610, category: 'Chain Snatching', hoursAgo: 25, stationId: 'koramangala' },
  { id: 'K5', lat: 12.925, lng: 77.640, category: 'Robbery', hoursAgo: 200, stationId: 'koramangala' },
  { id: 'K6', lat: 12.938, lng: 77.625, category: 'Vehicle Theft', hoursAgo: 1, stationId: 'koramangala' },
  { id: 'K7', lat: 12.932, lng: 77.635, category: 'Chain Snatching', hoursAgo: 18, stationId: 'koramangala' },
  { id: 'K8', lat: 12.928, lng: 77.620, category: 'Cyber Fraud', hoursAgo: 50, stationId: 'koramangala' },

  // Indiranagar
  { id: 'I1', lat: 12.980, lng: 77.645, category: 'Robbery', hoursAgo: 1, stationId: 'indiranagar' },
  { id: 'I2', lat: 12.970, lng: 77.640, category: 'Chain Snatching', hoursAgo: 8, stationId: 'indiranagar' },
  { id: 'I3', lat: 12.985, lng: 77.650, category: 'Vehicle Theft', hoursAgo: 14, stationId: 'indiranagar' },
  { id: 'I4', lat: 12.965, lng: 77.655, category: 'Cyber Fraud', hoursAgo: 30, stationId: 'indiranagar' },
  { id: 'I5', lat: 12.975, lng: 77.642, category: 'Robbery', hoursAgo: 2, stationId: 'indiranagar' },
  { id: 'I6', lat: 12.988, lng: 77.638, category: 'Vehicle Theft', hoursAgo: 9, stationId: 'indiranagar' },
  { id: 'I7', lat: 12.968, lng: 77.648, category: 'Cyber Fraud', hoursAgo: 100, stationId: 'indiranagar' },
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */
function matchesTime(hoursAgo: number, horizon: string): boolean {
  switch (horizon) {
    case 'Last 24 Hours': return hoursAgo <= 24;
    case 'Last 7 Days': return hoursAgo <= 168;
    case 'Last 30 Days': return hoursAgo <= 720;
    default: return true;
  }
}

// Calculate center of polygon for label placement
function polygonCenter(coords: [number, number][]): [number, number] {
  let lat = 0, lng = 0;
  for (let i = 0; i < coords.length; i++) {
    lat += coords[i][0];
    lng += coords[i][1];
  }
  return [lat / coords.length, lng / coords.length];
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function CrimeHotspotsClient() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Leaflet map instance
  const heatLayerRef = useRef<any>(null); // Leaflet heat instance

  const [mapReady, setMapReady] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTime, setSelectedTime] = useState<string>('All Time');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);

  const categories = ['All', 'Cyber Fraud', 'Chain Snatching', 'Vehicle Theft', 'Robbery'];
  const horizons = ['All Time', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days'];

  /* ---------- Filter Data ------------------------------------------ */
  const filteredIncidents = useMemo(() => {
    return MOCK_INCIDENTS.filter(i => {
      if (selectedCategory !== 'All' && i.category !== selectedCategory) return false;
      if (!matchesTime(i.hoursAgo, selectedTime)) return false;
      if (selectedStation && i.stationId !== selectedStation.id) return false;
      return true;
    });
  }, [selectedCategory, selectedTime, selectedStation]);

  const stationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATIONS.forEach(s => { counts[s.id] = 0; });
    filteredIncidents.forEach(i => { counts[i.stationId] = (counts[i.stationId] || 0) + 1; });
    return counts;
  }, [filteredIncidents]);

  /* ---------- Dynamic Script Loader for Leaflet -------------------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.L) {
      setMapReady(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const heatScript = document.createElement('script');
      heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      heatScript.onload = () => setMapReady(true);
      document.head.appendChild(heatScript);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup not strictly necessary for CDN scripts, but good practice if remounting wildly
    };
  }, []);

  /* ---------- Initialize Map --------------------------------------- */
  useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return;
    const L = window.L;

    // 1. Create Map
    const map = L.map(mapContainer.current, {
      zoomControl: false, // We can hide it or customize it
      attributionControl: false,
    }).setView(BENGALURU_CENTER, 13);
    mapRef.current = map;

    // 2. Add CARTO Dark Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 3. Draw Jurisdiction Polygons & Labels
    STATIONS.forEach(station => {
      // Polygon
      const polygon = L.polygon(station.boundary, {
        color: station.color,
        weight: 2,
        dashArray: '6, 6',
        fillColor: station.color,
        fillOpacity: 0.12,
        className: 'transition-opacity duration-300'
      }).addTo(map);

      // Label Marker (Centroid)
      const center = polygonCenter(station.boundary);
      const icon = L.divIcon({
        html: `<div class="bg-white text-slate-900 font-semibold px-3 py-1 rounded-md shadow-lg text-xs border border-slate-200 whitespace-nowrap text-center transform -translate-x-1/2 -translate-y-1/2">${station.name}</div>`,
        className: 'custom-leaflet-label',
        iconSize: [0, 0] // the CSS translate will center it
      });
      L.marker(center, { icon, interactive: false }).addTo(map);

      // Patrol Icons (Green Shields)
      station.patrols.forEach(coord => {
        const patrolIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div class="absolute inset-0 rounded-full animate-ping bg-emerald-500/30"></div>
            </div>
          `,
          className: 'patrol-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker(coord, { icon: patrolIcon }).addTo(map);
      });

      // Click event for polygon selection
      polygon.on('click', () => {
        setSelectedStation(station);
      });
    });

    // 4. Initialize Heatmap Layer
    // Format: [[lat, lng, intensity], ...]
    const heatData = filteredIncidents.map(i => [i.lat, i.lng, 1]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 1.5,
      // Cyan outer glow -> Yellow/Orange -> Crimson Red centers
      gradient: {
        0.2: 'rgba(6, 182, 212, 0.6)',   // Cyan
        0.5: 'rgba(250, 204, 21, 0.8)',  // Yellow
        0.7: 'rgba(249, 115, 22, 0.9)',  // Orange
        1.0: 'rgba(239, 68, 68, 1)'      // Crimson Red
      },
    }).addTo(map);
    heatLayerRef.current = heatLayer;

    // Small hack to ensure Leaflet calculates container size correctly in flexbox
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      map.remove();
      mapRef.current = null;
      heatLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]); // Only run on mount once mapReady is true

  /* ---------- Update Heatmap & Selection on Filter Change ----------- */
  useEffect(() => {
    if (!mapRef.current || !heatLayerRef.current || !window.L) return;

    // Update Heat Data
    const heatData = filteredIncidents.map(i => [i.lat, i.lng, 1]);
    heatLayerRef.current.setLatLngs(heatData);

    // Fly to station if selected, else center
    if (selectedStation) {
      const center = polygonCenter(selectedStation.boundary);
      mapRef.current.flyTo(center, 14, { duration: 1.2 });
    } else {
      mapRef.current.flyTo(BENGALURU_CENTER, 13, { duration: 1.2 });
    }
  }, [filteredIncidents, selectedStation]);


  /* ---------- Category Style Helper -------------------------------- */
  const catStyle = (cat: string, active: boolean) => {
    if (!active) return 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800';
    switch (cat) {
      case 'Cyber Fraud': return 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400';
      case 'Chain Snatching': return 'bg-amber-500/15 border-amber-500/50 text-amber-400';
      case 'Vehicle Theft': return 'bg-purple-500/15 border-purple-500/50 text-purple-400';
      case 'Robbery': return 'bg-red-500/15 border-red-500/50 text-red-400';
      default: return 'bg-red-500/20 border-red-500/50 text-red-400';
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex min-h-[500px] h-full w-full overflow-hidden rounded-xl border border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
      
      {/* ---- Leaflet Map Area ---- */}
      <div className="flex-1 relative w-full h-full">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-50">
            <div className="animate-pulse text-zinc-500 font-data tracking-widest text-xs uppercase">Initializing Map Engine...</div>
          </div>
        )}
        
        <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />
        
        {/* Vignette Overlay to enhance dark tactical UI */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.4)_100%)] z-[100]" />

        {/* Selected Jurisdiction Banner */}
        {selectedStation && (
          <div className="absolute top-4 left-4 z-[200] bg-white/95 border border-slate-200 rounded-lg p-3 max-w-xs shadow-lg animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-slate-800" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-800">Selected Jurisdiction</span>
                </div>
                <div className="text-slate-900 font-bold text-sm">{selectedStation.name}</div>
                <div className="text-slate-600 text-xs mt-0.5">
                  Active Incidents: <span className="text-emerald-600 font-bold">{stationCounts[selectedStation.id] || 0}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStation(null)} 
                className="text-slate-400 hover:text-slate-800 transition-colors shrink-0"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Density Scale Legend */}
        <div className="absolute bottom-3 left-3 z-[200] bg-black/75 border border-zinc-700/50 rounded-lg px-3 py-2 pointer-events-none backdrop-blur-sm">
          <div className="text-[9px] font-data text-zinc-500 uppercase tracking-wider mb-1">Density Scale</div>
          <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{
            background: 'linear-gradient(to right, rgba(6, 182, 212, 0.6), rgba(250, 204, 21, 0.8), rgba(249, 115, 22, 0.9), rgba(239, 68, 68, 1))',
          }} />
          <div className="flex justify-between text-[8px] font-data text-zinc-500 mt-0.5 w-24">
            <span>Low</span><span>Critical</span>
          </div>
        </div>
      </div>

      {/* ---- Right-Side Control Panel ---- */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-900/90 backdrop-blur flex flex-col z-[200] shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Tactical Overview
          </h2>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase font-data tracking-wider">
            Toggle filters to update density map
          </p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* ---- Jurisdiction Selector ---- */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Jurisdiction
            </label>
            <div className="relative">
              <button
                onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
                className="w-full text-left px-3 py-2 rounded border border-zinc-700 bg-zinc-950/60 text-sm text-zinc-200 flex justify-between items-center hover:border-zinc-500 transition-colors"
              >
                <span>{selectedStation ? selectedStation.name : 'All Jurisdictions'}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${stationDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {stationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setSelectedStation(null); setStationDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors ${!selectedStation ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-300'}`}
                  >
                    All Jurisdictions
                  </button>
                  {STATIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStation(s); setStationDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors flex justify-between ${selectedStation?.id === s.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-300'}`}
                    >
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---- Crime Category Filter ---- */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Crime Category
            </label>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                const count = MOCK_INCIDENTS.filter(i =>
                  (cat === 'All' || i.category === cat) &&
                  matchesTime(i.hoursAgo, selectedTime) &&
                  (!selectedStation || i.stationId === selectedStation.id)
                ).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-all border flex justify-between items-center ${catStyle(cat, active)}`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-60 font-data">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- Time Horizon Filter ---- */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Time Horizon
            </label>
            <div className="space-y-1.5">
              {horizons.map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedTime(h)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all border ${
                    selectedTime === h
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ---- Footer ---- */}
        <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-500 font-data">
          <span className="text-white font-bold">{filteredIncidents.length}</span> incident{filteredIncidents.length !== 1 ? 's' : ''} visible
          {selectedStation && <span className="text-emerald-400"> in {selectedStation.name}</span>}
        </div>
      </div>
      
      {/* Global overrides for leaflet container z-index to not conflict with React dropdowns */}
      <style>{`
        .leaflet-pane { z-index: 10 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 10 !important; }
        .custom-leaflet-label { background: transparent; border: none; }
      `}</style>
    </div>
  );
}

// Add TS global for window.L since we're loading Leaflet dynamically
declare global {
  interface Window {
    L: any;
  }
}
