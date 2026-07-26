'use client';
import { useState } from 'react';
import { Fingerprint, ScanFace } from 'lucide-react';
import FingerprintTabs from '@/components/FingerprintTabs';
import FaceMatchTab from '@/components/FaceMatchTab';

type Tab = 'fingerprint' | 'face';

export default function BiometricModuleTabs() {
  const [active, setActive] = useState<Tab>('fingerprint');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'fingerprint', label: 'Fingerprint Matching', icon: Fingerprint },
    { id: 'face',        label: 'Facial Recognition',  icon: ScanFace   },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`biometric-tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === tab.id
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      {active === 'fingerprint' && <FingerprintTabs />}
      {active === 'face'        && <FaceMatchTab />}
    </div>
  );
}
