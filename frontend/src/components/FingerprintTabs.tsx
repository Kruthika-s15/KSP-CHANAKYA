'use client';

import { useState } from 'react';
import { ScanSearch, ScanFace } from 'lucide-react';
import FingerprintIdentifier from './FingerprintIdentifier';
import FingerprintVerifier from './FingerprintVerifier';

export default function FingerprintTabs() {
  const [activeTab, setActiveTab] = useState<'identify' | 'verify'>('identify');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('identify')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'identify'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <ScanSearch className={`w-4 h-4 ${activeTab === 'identify' ? 'text-red-500' : ''}`} />
          <span className="font-semibold text-sm tracking-wide">1-to-N Identification (AFIS)</span>
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'verify'
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <ScanFace className={`w-4 h-4 ${activeTab === 'verify' ? 'text-red-500' : ''}`} />
          <span className="font-semibold text-sm tracking-wide">1-to-1 Verification</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'identify' && <FingerprintIdentifier />}
        {activeTab === 'verify' && <FingerprintVerifier />}
      </div>
    </div>
  );
}
