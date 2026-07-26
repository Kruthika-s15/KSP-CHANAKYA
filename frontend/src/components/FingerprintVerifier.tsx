'use client';

import { useState, useRef, useCallback } from 'react';
import { Fingerprint, Upload, X, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface VerifyResult {
  match_score: number;
  status: 'MATCH' | 'NO MATCH';
  visualization: string;
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
    <div className="flex-1 min-w-0">
      <p className="font-data text-[10px] tracking-widest text-zinc-500 uppercase mb-2">
        {label}
      </p>
      {preview ? (
        <div className="relative group rounded-lg border border-zinc-700 bg-black/30 overflow-hidden">
          <img
            src={preview}
            alt={label}
            className="w-full h-56 object-contain bg-black/60"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="px-3 py-2 text-xs text-zinc-400 truncate border-t border-zinc-800">
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
            h-56 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
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

export default function FingerprintVerifier() {
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [samplePreview, setSamplePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (
    setter: typeof setSampleFile,
    previewSetter: typeof setSamplePreview,
  ) => (file: File) => {
    setter(file);
    const reader = new FileReader();
    reader.onload = () => previewSetter(reader.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const clearFile = (
    setter: typeof setSampleFile,
    previewSetter: typeof setSamplePreview,
  ) => () => {
    setter(null);
    previewSetter(null);
    setResult(null);
    setError(null);
  };

  const handleVerify = async () => {
    if (!sampleFile || !targetFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('sample', sampleFile);
    fd.append('target', targetFile);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/v1/biometrics/verify', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Server error ${res.status}`);
      }

      const data: VerifyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSampleFile(null);
    setTargetFile(null);
    setSamplePreview(null);
    setTargetPreview(null);
    setResult(null);
    setError(null);
  };

  const isMatch = result?.status === 'MATCH';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Fingerprint Verification</p>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-red-500" />
            Image-Based Fingerprint Match
          </h2>
        </div>
        {(sampleFile || targetFile || result) && (
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Upload zone */}
      <div className="cmd-panel p-5">
        <div className="flex gap-5">
          <DropZone
            label="Sample Fingerprint"
            file={sampleFile}
            preview={samplePreview}
            onFileSelect={selectFile(setSampleFile, setSamplePreview)}
            onClear={clearFile(setSampleFile, setSamplePreview)}
          />

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
            <span className="font-data text-[11px] tracking-widest text-red-500/70 my-3">VS</span>
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
          </div>

          <DropZone
            label="Target Fingerprint"
            file={targetFile}
            preview={targetPreview}
            onFileSelect={selectFile(setTargetFile, setTargetPreview)}
            onClear={clearFile(setTargetFile, setTargetPreview)}
          />
        </div>

        {/* Verify button */}
        <div className="mt-5 flex justify-center">
          <button
            onClick={handleVerify}
            disabled={!sampleFile || !targetFile || loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-8 rounded-lg flex items-center gap-2 transition-all text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                Verify Match
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
        <div className="space-y-4 animate-in fade-in duration-500">
          {/* Score + badge row */}
          <div className="cmd-panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                {/* Circular score indicator */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-zinc-800"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${(result.match_score / 100) * 213.6} 213.6`}
                      strokeLinecap="round"
                      className={isMatch ? 'text-emerald-500' : 'text-red-500'}
                      style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-data text-lg text-white">
                      {result.match_score}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Match Score</p>
                  <p className="text-2xl font-bold text-white font-data">
                    {result.match_score}
                    <span className="text-sm text-zinc-500 ml-1">/ 100</span>
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide
                  ${isMatch
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }
                `}
              >
                {isMatch ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {result.status}
              </div>
            </div>
          </div>

          {/* Visualization overlay */}
          {result.visualization && (
            <div className="cmd-panel overflow-hidden">
              <div className="cmd-panel-header px-4 py-3 flex items-center justify-between">
                <p className="font-data text-[10px] tracking-widest text-zinc-500 uppercase">
                  Feature Match Visualization
                </p>
              </div>
              <div className="p-2 bg-black/40">
                <img
                  src={result.visualization}
                  alt="Fingerprint match visualization overlay"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
