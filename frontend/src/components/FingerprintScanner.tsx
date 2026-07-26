'use client';

import { Fingerprint, Lock, Globe2 } from 'lucide-react';

/**
 * Decorative biometric-scan hero, styled after the reference HUD graphic:
 * a bordered scan panel on the left with connector lines running out to a
 * stack of glass readout boxes on the right, plus a small lock badge.
 * Purely visual — the real search form below this still does the work.
 */
export default function FingerprintScanner() {
  return (
    <div className="cmd-panel p-6 overflow-hidden relative">
      <div className="absolute inset-0 hex-grid opacity-20 pointer-events-none" />
      <div className="relative flex items-stretch gap-6">
        {/* Scan panel */}
        <div className="relative w-40 h-40 shrink-0 rounded-lg border border-red-500/40 bg-black/30 flex items-center justify-center">
          <div className="scan-rings"><span /><span /><span /></div>
          <Fingerprint className="w-16 h-16 text-red-400 relative z-10" strokeWidth={1} />
          {/* corner ticks */}
          <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-red-500/70" />
          <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-red-500/70" />
          <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-red-500/70" />
          <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-red-500/70" />
          {/* lock badge */}
          <div className="absolute -bottom-3 -left-3 w-7 h-7 rounded-full bg-red-600/90 border border-red-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.6)]">
            <Lock className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Connector lines + readout boxes */}
        <div className="flex-1 min-w-0 relative flex flex-col justify-between py-1">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <line x1="0" y1="15%" x2="30%" y2="15%" stroke="var(--accent-line)" strokeWidth="1" />
            <line x1="0" y1="50%" x2="55%" y2="50%" stroke="var(--accent-line)" strokeWidth="1" />
            <line x1="0" y1="85%" x2="30%" y2="85%" stroke="var(--accent-line)" strokeWidth="1" />
          </svg>
          <div className="ml-[30%] font-data text-[10px] tracking-widest text-zinc-500 border border-red-500/20 rounded px-3 py-2 bg-black/20 w-2/3">
            RIDGE PATTERN &nbsp;·&nbsp; MINUTIAE SCAN PENDING
          </div>
          <div className="ml-[55%] font-data text-[10px] tracking-widest text-zinc-500 border border-red-500/20 rounded px-3 py-2 bg-black/20 w-1/2 flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
            CROSS-CASE LOOKUP · ALL DISTRICTS
          </div>
          <div className="ml-[30%] font-data text-[10px] tracking-widest text-zinc-500 border border-red-500/20 rounded px-3 py-2 bg-black/20 w-2/3">
            REPEAT-OFFENDER INDEX &nbsp;·&nbsp; STANDBY
          </div>
        </div>
      </div>
    </div>
  );
}
