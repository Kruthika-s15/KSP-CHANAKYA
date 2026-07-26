'use client';
import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function OverviewRadarMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  // High-value threat pins
  const incidents = [
    { id: 'mg-road', lng: 77.6070, lat: 12.9756, label: 'MG Road Sector — High Density' },
    { id: 'whitefield', lng: 77.7499, lat: 12.9698, label: 'Whitefield Tech Hub — Cyber Alert' },
    { id: 'electronic-city', lng: 77.6649, lat: 12.8399, label: 'Electronic City — Patrol Active' },
    { id: 'koramangala', lng: 77.6229, lat: 12.9352, label: 'Koramangala — Night Anomaly' },
    { id: 'majestic', lng: 77.5713, lat: 12.9767, label: 'Majestic Bus Terminal — Station Hub' },
    { id: 'indiranagar', lng: 77.6412, lat: 12.9784, label: 'Indiranagar — CCTV Active' },
    { id: 'hebbal', lng: 77.5913, lat: 13.0358, label: 'Hebbal Circle — Traffic Grid' },
    { id: 'jayanagar', lng: 77.5828, lat: 12.9250, label: 'Jayanagar — Sector 4' },
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        style: RASTER_STYLE,
        center: [77.5946, 12.9716],
        zoom: 11.5,
        pitch: 45,
        bearing: -15,
        antialias: true,
        interactive: true,
      } as maplibregl.MapOptions & { antialias?: boolean });

      mapInstance.current.on('load', () => {
        incidents.forEach((inc) => {
          const el = document.createElement('div');
          el.className = 'radar-incident-marker group z-20 relative';

          const tooltip = document.createElement('div');
          tooltip.className = 'absolute bottom-4 left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black/90 border border-red-500/50 text-[10px] text-red-400 font-data tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50';
          tooltip.innerText = inc.label;
          el.appendChild(tooltip);

          new maplibregl.Marker({ element: el })
            .setLngLat([inc.lng, inc.lat])
            .addTo(mapInstance.current!);
        });

        mapInstance.current?.resize();
        setTimeout(() => {
          mapInstance.current?.resize();
        }, 300);
      });
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-[#0a0a0a]">
      {/* MapLibre Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" style={{ filter: 'grayscale(0.5) contrast(1.2)' }} />

      {/* CSS Radar Overlay (pointer-events-none so map is interactive) */}
      <div className="z-10 pointer-events-none absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Glowing Sector Grid Lines */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        {/* Radar Circles */}
        <div className="absolute w-[800px] h-[800px] border border-red-500/20 rounded-full" />
        <div className="absolute w-[500px] h-[500px] border border-red-500/30 rounded-full" />
        <div className="absolute w-[200px] h-[200px] border border-red-500/50 rounded-full bg-red-500/5" />

        {/* Rotating Sweep */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.4) 0deg, rgba(239, 68, 68, 0.05) 45deg, transparent 60deg)',
            animation: 'radar-spin 3s linear infinite',
            borderRadius: '50%',
            inset: 'auto'
          }}
        />

        {/* Center Crosshair */}
        <div className="absolute w-6 h-6 text-red-500">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-current -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 w-[2px] h-full bg-current -translate-x-1/2" />
        </div>
      </div>

      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <style jsx global>{`
        .radar-incident-marker {
          width: 14px;
          height: 14px;
          background: #ef4444;
          border-radius: 50%;
          position: relative;
          cursor: crosshair;
        }
        .radar-incident-marker::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(239, 68, 68, 0.9);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
