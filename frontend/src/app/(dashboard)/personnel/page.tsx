import { fetchPersonnelList } from '@/lib/api';
import Link from 'next/link';
import { Users, ShieldCheck } from 'lucide-react';

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const data = await fetchPersonnelList({ page, page_size: 20 }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
  }));

  const items = data.items || [];
  const total = data.total || 0;
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Human Resources Unit</p>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-6 h-6 mr-3 text-red-500" />
            Personnel Directory
          </h1>
        </div>
        <div className="text-sm text-zinc-400">Total Officers: {total}</div>
      </div>

      <div className="cmd-panel overflow-hidden">
        <table className="w-full text-sm text-left text-zinc-300">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Rank / Designation</th>
              <th className="px-6 py-4">District / Unit</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((emp: any) => (
                <tr
                  key={emp.EmployeeID}
                  className="bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-red-500" />
                      {emp.FirstName}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">KGID: {emp.KGID || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{emp.RankName || 'N/A'}</div>
                    <div className="text-xs text-zinc-500 mt-1">{emp.DesignationName || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{emp.UnitName || 'N/A'}</div>
                    <div className="text-xs text-zinc-500 mt-1">{emp.DistrictName || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/personnel/${emp.EmployeeID}`}
                      className="text-red-500 hover:text-red-400 font-medium text-sm"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  No personnel records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-950">
            <span className="text-sm text-zinc-400">
              Page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages}</span>
            </span>
            <div className="flex space-x-2">
              <Link
                href={`/personnel?page=${Math.max(1, page - 1)}`}
                className={`px-3 py-1 bg-zinc-800 rounded text-sm ${
                  page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-700'
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/personnel?page=${Math.min(totalPages, page + 1)}`}
                className={`px-3 py-1 bg-zinc-800 rounded text-sm ${
                  page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-700'
                }`}
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
