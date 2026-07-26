'use client';

const FEED = [
  'FIR SYNC :: OK',
  'BIOMETRIC INDEX :: 100% AVAILABLE',
  'CRIME-NETWORK GRAPH :: LINKED',
  'CATALYST SERVICES :: NOMINAL',
  'AI ASSISTANT :: ONLINE',
  'CITY TWIN FEED :: STREAMING',
  'DB REPLICA :: HEALTHY',
  'ENCRYPTION :: AES-256 ACTIVE',
];

export default function TickerBar() {
  const line = FEED.join('   //   ');
  return (
    <div className="app-ticker h-6 bg-black/60 border-b border-[var(--line)] overflow-hidden flex items-center shrink-0">
      <div className="ticker-track font-data text-[10px] text-red-400/70 tracking-widest pl-2">
        <span>{line}&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;&nbsp;{line}</span>
      </div>
    </div>
  );
}
