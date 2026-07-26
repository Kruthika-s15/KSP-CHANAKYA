'use client';
import { useState, useRef, useCallback } from 'react';
import { ScanFace, Upload, X, AlertTriangle, ShieldCheck, Loader2, ExternalLink, Eye, Percent } from 'lucide-react';
import Link from 'next/link';

type MatchResult = {
  mode: 'pairwise' | 'database_scan';
  status: 'MATCH' | 'NO MATCH';
  confidence: number;
  threshold?: number;
  message: string;
  suspect?: {
    AccusedName: string;
    BiometricRefID: string;
    CrimeNo: string | null;
    CaseNo: string | null;
    CaseMasterID: number;
    DistrictName: string;
    PoliceStationName: string;
    CrimeHead: string | null;
    CaseStatus: string | null;
  };
};

export default function FaceMatchTab() {
  const [probeFile, setProbeFile]     = useState<File | null>(null);
  const [probePreview, setProbePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [result, setResult]           = useState<MatchResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    setProbeFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setProbePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) loadFile(file);
  }, []);

  const handleSubmit = async () => {
    if (!probeFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      const form  = new FormData();
      form.append('probe', probeFile);

      const res = await fetch('http://127.0.0.1:8000/api/v1/biometrics/face-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearProbe = () => {
    setProbeFile(null);
    setProbePreview(null);
    setResult(null);
    setError(null);
  };

  const confidenceColor = (c: number) =>
    c >= 80 ? 'text-red-400' : c >= 60 ? 'text-amber-400' : 'text-emerald-400';

  const confidenceBg = (c: number) =>
    c >= 80 ? 'from-red-500' : c >= 60 ? 'from-amber-500' : 'from-emerald-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="cmd-eyebrow mb-1">KSP // Facial Recognition Unit</p>
        <h2 className="text-xl font-bold text-white flex items-center">
          <ScanFace className="w-5 h-5 mr-3 text-red-500" />
          Suspect Face Matching
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Upload a suspect photograph to scan against all facial biometric records in the KSP database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Upload panel ── */}
        <div className="cmd-panel p-5 space-y-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-data">
            Probe Image Upload
          </div>

          {!probePreview ? (
            <div
              id="face-drop-zone"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-56 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-red-500 bg-red-500/5'
                  : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/[0.02]'
              }`}
            >
              <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                {/* Corner markers */}
                {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
                  <div key={pos} className={`absolute ${pos} w-4 h-4 border-red-500/40`}
                    style={{
                      borderTop: pos.includes('top') ? '2px solid' : 'none',
                      borderBottom: pos.includes('bottom') ? '2px solid' : 'none',
                      borderLeft: pos.includes('left') ? '2px solid' : 'none',
                      borderRight: pos.includes('right') ? '2px solid' : 'none',
                    }}
                  />
                ))}
              </div>
              <ScanFace className="w-10 h-10 text-zinc-600 mb-3" strokeWidth={1} />
              <p className="text-sm text-zinc-400 font-medium">Drop suspect photo here</p>
              <p className="text-xs text-zinc-600 mt-1">or click to browse — JPG, PNG, WEBP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
                id="face-probe-input"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden h-56 bg-black">
              {/* Scan overlay animation */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70 animate-scan-line" />
                {/* Face alignment grid */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-40 border border-red-500/30 rounded-full" />
                </div>
              </div>
              <img
                src={probePreview}
                alt="Probe"
                className="w-full h-full object-cover"
              />
              <button
                onClick={clearProbe}
                className="absolute top-2 right-2 z-20 p-1 bg-black/60 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 z-20 font-data text-[10px] text-red-400/70 tracking-widest">
                PROBE LOADED // {probeFile?.name}
              </div>
            </div>
          )}

          <button
            id="face-match-submit"
            onClick={handleSubmit}
            disabled={!probeFile || isLoading}
            className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.35)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Database…</>
            ) : (
              <><ScanFace className="w-4 h-4" /> Run Facial Recognition</>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/40 rounded-lg p-3 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-red-400">Error: </span>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* ── Results panel ── */}
        <div className="cmd-panel p-5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-data mb-4">
            Match Results
          </div>

          {!result && !isLoading && (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center mb-3">
                <Eye className="w-7 h-7 text-zinc-700" strokeWidth={1} />
              </div>
              <p className="text-zinc-500 text-sm">Awaiting probe image</p>
              <p className="text-zinc-700 text-xs mt-1">Results will appear here after scan</p>
            </div>
          )}

          {isLoading && (
            <div className="h-56 flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-red-500/40 animate-pulse" />
                <ScanFace className="absolute inset-0 m-auto w-7 h-7 text-red-400" />
              </div>
              <p className="text-red-400 text-sm font-data tracking-widest animate-pulse">SCANNING BIOMETRIC DB…</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Verdict banner */}
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${
                result.status === 'MATCH'
                  ? 'bg-red-950/20 border-red-900/40'
                  : 'bg-emerald-950/20 border-emerald-900/40'
              }`}>
                {result.status === 'MATCH' ? (
                  <AlertTriangle className="w-7 h-7 text-red-500 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-emerald-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-white text-base">
                    {result.status === 'MATCH' ? 'Suspect Identified' : 'No Match Found'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">{result.message}</div>
                </div>
                <div className={`text-3xl font-black font-data ${confidenceColor(result.confidence)}`}>
                  {result.confidence}%
                </div>
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1 font-data">
                  <span>FACIAL SIMILARITY</span>
                  <span className={confidenceColor(result.confidence)}>{result.confidence}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${confidenceBg(result.confidence)} to-transparent rounded-full transition-all duration-700`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                {result.threshold && (
                  <div
                    className="relative mt-1"
                    style={{ paddingLeft: `${result.threshold}%` }}
                  >
                    <div className="text-[10px] text-zinc-600 font-data">▲ THRESHOLD {result.threshold}%</div>
                  </div>
                )}
              </div>

              {/* Suspect profile */}
              {result.suspect && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-data mb-3">Suspect Profile</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-zinc-500 text-xs">Name</div>
                      <div className="text-white font-semibold">{result.suspect.AccusedName}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">Biometric Ref</div>
                      <div className="text-zinc-300 font-data text-xs">{result.suspect.BiometricRefID}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">Case No</div>
                      <div className="text-red-400 font-semibold">{result.suspect.CrimeNo || result.suspect.CaseNo || '—'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">Status</div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        result.suspect.CaseStatus?.toLowerCase().includes('closed')
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {result.suspect.CaseStatus || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">Crime Head</div>
                      <div className="text-red-400 text-xs">{result.suspect.CrimeHead || '—'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">Station / District</div>
                      <div className="text-zinc-300 text-xs">{result.suspect.PoliceStationName}</div>
                      <div className="text-zinc-600 text-xs">{result.suspect.DistrictName}</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link
                      href={`/crimes/${result.suspect.CaseMasterID}`}
                      className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      View Full Case File <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0%   { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          position: absolute;
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
