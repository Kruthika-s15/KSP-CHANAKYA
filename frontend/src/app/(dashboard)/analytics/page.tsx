import { fetchAnalytics } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

const GROUP_OPTIONS = [
  { value: 'district', label: 'District' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Case Status' },
  { value: 'crime_head', label: 'Crime Head' },
  { value: 'month', label: 'Month' },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams;
  const groupBy = (params.group_by as string) || 'district';

  const data = await fetchAnalytics({ group_by: groupBy }).catch(() => null);
  const buckets = data?.buckets || [];
  const maxCount = buckets.length > 0 ? Math.max(...buckets.map((b: any) => b.count)) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Statistical Intelligence</p>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-red-500" />
            Crime Analytics
          </h1>
        </div>
        {data && (
          <div className="text-sm text-zinc-400">Total Cases: {data.total_cases}</div>
        )}
      </div>

      <div className="cmd-panel p-4">
        <form method="GET" className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Break down by</label>
            <select
              name="group_by"
              defaultValue={groupBy}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 p-2 min-w-[180px]"
            >
              {GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Update
          </button>
        </form>
      </div>

      <div className="cmd-panel p-6">
        {buckets.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">No data available for this breakdown.</div>
        ) : (
          <div className="space-y-4">
            {buckets.map((b: any) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-200 font-medium">{b.label}</span>
                  <span className="text-zinc-400">{b.count}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-red-600 h-3 rounded-full"
                    style={{ width: `${maxCount > 0 ? (b.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
