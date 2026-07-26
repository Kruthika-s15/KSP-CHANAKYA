'use client';
import { Flame, Loader2 } from 'lucide-react';
import CrimeHotspotsClient from '@/components/ksp/CrimeHotspotsClient';

export default function CrimeHotspotsPage() {
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">
      <div>
        <p className="cmd-eyebrow mb-1">KSP // Geospatial Intelligence — Density Analysis</p>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-500" />
          Crime Hotspots (Heatmap)
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Geospatial density visualization of criminal activity clusters across Bengaluru.
        </p>
      </div>
      <div className="flex-1 overflow-hidden min-h-[500px]">
        <CrimeHotspotsClient />
      </div>
    </div>
  );
}
