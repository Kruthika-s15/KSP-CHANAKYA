'use client';

import { useState, useRef, useCallback } from 'react';
import { Fingerprint, Upload, X, Loader2, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ShieldCheck, User, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface IdentifyResult {
  status: 'MATCH' | 'NO MATCH';
  match_score: number;
  visualization?: string;
  message?: string;
  suspect?: {
    BiometricID: number;
    BiometricType: string;
    BiometricRefID: string;
    AccusedMasterID: number;
    AccusedName: string;
    CaseMasterID: number;
    CrimeNo: string;
    CaseNo: string;
    DistrictName: string;
    PoliceStationName: string;
    CrimeHead: string;
    CaseStatus: string;
  };
}

function DropZone({
  label,
  file,
  preview,
  onFileSelect,
  onClear,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onFileSelect: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith('image/')) onFileSelect(f);
    },
    [onFileSelect],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFileSelect(f);
    },
    [onFileSelect],
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <p className="font-data text-[10px] tracking-widest text-zinc-500 uppercase mb-2 text-center">
        {label}
      </p>
      {preview ? (
        <div className="relative group rounded-lg border border-zinc-700 bg-black/30 overflow-hidden">
          <img
            src={preview}
            alt={label}
            className="w-full h-64 object-contain bg-black/60"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="px-3 py-2 text-xs text-zinc-400 truncate border-t border-zinc-800 text-center">
            {file?.name}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
          className={`
            h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${dragOver
              ? 'border-red-500 bg-red-500/5'
              : 'border-zinc-700 hover:border-zinc-500 bg-black/20 hover:bg-black/30'
            }
          `}
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center">
            <Upload className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-sm text-zinc-400">Drop image here</p>
            <p className="text-xs text-zinc-600 mt-1">or click to browse</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export default function FingerprintIdentifier() {
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [samplePreview, setSamplePreview] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file: File) => {
    setSampleFile(file);
    const reader = new FileReader();
    reader.onload = () => setSamplePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const clearFile = () => {
    setSampleFile(null);
    setSamplePreview(null);
    setResult(null);
    setError(null);
  };

  const handleIdentify = async () => {
    if (!sampleFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('sample', sampleFile);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/v1/biometrics/identify', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Server error ${res.status}`);
      }

      const data: IdentifyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Identification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearFile();
  };

  const isMatch = result?.status === 'MATCH';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="cmd-eyebrow mb-1">AFIS // Automated Fingerprint Identification System</p>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-red-500" />
            1-to-N Database Search
          </h2>
        </div>
        {(sampleFile || result) && (
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div className="cmd-panel p-6">
        <DropZone
          label="Unknown Fingerprint"
          file={sampleFile}
          preview={samplePreview}
          onFileSelect={selectFile}
          onClear={clearFile}
        />
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleIdentify}
            disabled={!sampleFile || loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium py-3 px-10 rounded-lg flex items-center gap-2 transition-all text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning Database…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Identify Subject
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="cmd-panel p-4 border-red-900/40 bg-red-950/20 text-red-400 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
          {!isMatch ? (
            <div className="cmd-panel p-8 text-center flex flex-col items-center justify-center bg-zinc-900/50">
              <ShieldCheck className="w-12 h-12 text-zinc-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Matches Found</h3>
              <p className="text-sm text-zinc-400">
                {result.message || 'This fingerprint does not match any record in the AFIS database.'}
              </p>
              <div className="mt-4 font-data text-xs text-zinc-500 bg-black/40 px-3 py-1.5 rounded">
                MAX MATCH SCORE: {result.match_score}%
              </div>
            </div>
          ) : (
            <div className="cmd-panel overflow-hidden border-emerald-900/40">
              {/* Match Header */}
              <div className="bg-emerald-950/20 border-b border-emerald-900/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-emerald-400 font-bold text-lg leading-tight">POSITIVE IDENTIFICATION</h3>
                    <p className="text-xs text-emerald-500/70 font-data tracking-widest uppercase">AFIS Database Match</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-data font-bold text-white leading-none">
                    {result.match_score}<span className="text-lg text-zinc-500">%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-data tracking-widest mt-1">CONFIDENCE SCORE</div>
                </div>
              </div>

              {/* Subject Profile */}
              {result.suspect && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-data tracking-widest uppercase mb-1">Accused Name</p>
                      <p className="text-xl font-semibold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-zinc-400" />
                        {result.suspect.AccusedName}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-data tracking-widest uppercase mb-1">Crime No.</p>
                        <p className="text-sm font-medium text-red-400">{result.suspect.CrimeNo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-data tracking-widest uppercase mb-1">Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                          result.suspect.CaseStatus?.toLowerCase().includes('closed')
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {result.suspect.CaseStatus || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-data tracking-widest uppercase mb-1">Police Station</p>
                        <p className="text-sm text-zinc-300">{result.suspect.PoliceStationName || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-data tracking-widest uppercase mb-1">District</p>
                        <p className="text-sm text-zinc-300">{result.suspect.DistrictName || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Link
                        href={`/crimes/${result.suspect.CaseMasterID}`}
                        className="inline-flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        View Full Case File
                        <ExternalLink className="w-4 h-4 text-zinc-400" />
                      </Link>
                    </div>
                  </div>

                  {/* Visualization */}
                  {result.visualization && (
                    <div className="rounded border border-zinc-800 overflow-hidden bg-black flex items-center justify-center relative group">
                      <div className="absolute inset-0 scan-rings opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
                        <span /><span /><span />
                      </div>
                      <img 
                        src={result.visualization} 
                        alt="Match visualization" 
                        className="w-full h-auto max-h-56 object-contain relative z-10"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
