import { fetchCrimes, fetchCategories } from '@/lib/api';
import Link from 'next/link';
import { Search, Filter, AlertCircle } from 'lucide-react';

export default async function CrimesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const page = Number(params.page || 1);
  const data = await fetchCrimes({ ...params, page, page_size: 20 }).catch(() => ({ items: [], total: 0 }));
  const categories = await fetchCategories().catch(() => null);

  const items = data.items || [];
  const total = data.total || 0;
  const totalPages = Math.ceil(total / 20);

  // Preserve all applied filters when changing pages.
  const buildPageHref = (targetPage: number) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'page') return;
      if (value !== undefined && value !== '') qs.set(key, String(value));
    });
    qs.set('page', String(targetPage));
    return `/crimes?${qs.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Records Division</p>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <AlertCircle className="w-6 h-6 mr-3 text-red-500" />
            Crime Intelligence Database
          </h1>
        </div>
        <div className="text-sm text-zinc-400">Total Records: {total}</div>
      </div>

      <div className="cmd-panel p-4">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Search Case/Crime No</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                name="crime_no"
                defaultValue={params.crime_no as string || ''}
                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2"
                placeholder="FIR / Crime Number..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Case Number</label>
            <input
              type="text"
              name="case_no"
              defaultValue={params.case_no as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
              placeholder="Case Number..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Crime Head</label>
            <select 
              name="crime_head_id" 
              defaultValue={params.crime_head_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Crime Heads</option>
              {categories?.crime_heads?.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Crime Sub-Head</label>
            <select
              name="crime_sub_head_id"
              defaultValue={params.crime_sub_head_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Sub-Heads</option>
              {categories?.crime_sub_heads?.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">District</label>
            <select 
              name="district_id" 
              defaultValue={params.district_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Districts</option>
              {categories?.districts?.map((d:any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Police Station</label>
            <select
              name="police_station_id"
              defaultValue={params.police_station_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Stations</option>
              {categories?.police_stations?.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Case Status</label>
            <select
              name="case_status_id"
              defaultValue={params.case_status_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Statuses</option>
              {categories?.case_statuses?.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Gravity</label>
            <select
              name="gravity_offence_id"
              defaultValue={params.gravity_offence_id as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            >
              <option value="">All Gravity Levels</option>
              {categories?.gravity_offences?.map((c:any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">From Date</label>
            <input
              type="date"
              name="start_date"
              defaultValue={params.start_date as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">To Date</label>
            <input
              type="date"
              name="end_date"
              defaultValue={params.end_date as string || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg w-full flex justify-center items-center transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
            <Link href="/crimes" className="text-xs text-zinc-400 hover:text-white px-3 py-2 border border-zinc-700 rounded-lg whitespace-nowrap">
              Clear
            </Link>
          </div>
        </form>
      </div>

      <div className="cmd-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-300">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4">Crime No / Date</th>
                <th scope="col" className="px-6 py-4">Category / Head</th>
                <th scope="col" className="px-6 py-4">Location</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any) => (
                <tr key={item.CaseMasterID} className="bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-white">{item.CrimeNo || item.CaseNo}</div>
                    <div className="text-xs text-zinc-500 mt-1">{item.CrimeRegisteredDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-red-400">{item.CrimeHead || 'Unknown'}</div>
                    <div className="text-xs text-zinc-500 mt-1">{item.CrimeSubHead || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{item.PoliceStationName}</div>
                    <div className="text-xs text-zinc-500 mt-1">{item.DistrictName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.CaseStatus?.toLowerCase().includes('closed') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {item.CaseStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/crimes/${item.CaseMasterID}`} className="text-red-500 hover:text-red-400 font-medium text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No cases found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-950">
            <span className="text-sm text-zinc-400">
              Showing page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
            </span>
            <div className="flex space-x-2">
              <Link 
                href={buildPageHref(Math.max(1, page - 1))} 
                className={`px-3 py-1 bg-zinc-800 rounded text-sm ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-700'}`}
              >
                Previous
              </Link>
              <Link 
                href={buildPageHref(Math.min(totalPages, page + 1))} 
                className={`px-3 py-1 bg-zinc-800 rounded text-sm ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-700'}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
