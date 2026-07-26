'use client';
import { useEffect, useState } from 'react';
import { Map, Loader2 } from 'lucide-react';
import { fetchCrimes } from '@/lib/api';
import CityTwinMap from '@/components/CityTwinMap';

const MOCK_TWIN_CRIMES = [
  { CaseMasterID: 'T1', latitude: 12.9716, longitude: 77.5946, CrimeHead: 'Cyber Fraud', PoliceStationName: 'Cubbon Park PS' },
  { CaseMasterID: 'T2', latitude: 12.9345, longitude: 77.6186, CrimeHead: 'Vehicle Theft', PoliceStationName: 'Koramangala PS' },
  { CaseMasterID: 'T3', latitude: 12.9911, longitude: 77.7375, CrimeHead: 'Chain Snatching', PoliceStationName: 'Whitefield PS' },
  { CaseMasterID: 'T4', latitude: 12.9279, longitude: 77.6271, CrimeHead: 'Robbery', PoliceStationName: 'Madiwala PS' },
  { CaseMasterID: 'T5', latitude: 12.9784, longitude: 77.6408, CrimeHead: 'Cyber Fraud', PoliceStationName: 'Indiranagar PS' },
];

export default function CityTwinPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCrimes({ page: 1, page_size: 200 })
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setCases(data.items);
        } else {
          setCases(MOCK_TWIN_CRIMES);
        }
      })
      .catch((err) => {
        setCases(MOCK_TWIN_CRIMES);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Geospatial Operations</p>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Map className="w-6 h-6 mr-3 text-red-500" />
            Digital City Twin
          </h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden min-h-[500px] w-full relative">
        {loading ? (
           <div className="h-full flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800">
             <div className="flex flex-col items-center text-zinc-500">
               <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
               <span className="text-xs uppercase tracking-wider font-data">Establishing Link</span>
             </div>
           </div>
        ) : (
           <CityTwinMap cases={cases} />
        )}
      </div>
    </div>
  );
}
