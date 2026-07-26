import { fetchNetworkOverview, fetchNetworkForCase, fetchCategories, fetchCase } from '@/lib/api';
import NetworkGraph from '@/components/NetworkGraph';
import Link from 'next/link';
import { Share2, X, AlertTriangle } from 'lucide-react';

export default async function CrimeNetworkPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams;
  const caseId = params.case_id as string | undefined;
  const districtId = params.district_id as string | undefined;
  const crimeHeadId = params.crime_head_id as string | undefined;
  const limitCases = (params.limit_cases as string) || '25';

  const categories = await fetchCategories().catch(() => null);

  let graph: any = null;
  let focusCase: any = null;
  let error: string | null = null;

  if (caseId) {
    graph = await fetchNetworkForCase(caseId).catch(() => null);
    if (!graph) {
      error = 'Case not found or has no network data.';
    } else {
      focusCase = await fetchCase(caseId).catch(() => null);
    }
  } else {
    graph = await fetchNetworkOverview({
      limit_cases: limitCases,
      district_id: districtId,
      crime_head_id: crimeHeadId,
    }).catch(() => null);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="cmd-eyebrow mb-1">KSP // Link Analysis Engine</p>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Share2 className="w-6 h-6 mr-3 text-red-500" />
            Crime Network
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {caseId
              ? 'Relationships tied to this case: people, officer, and any other case files linked through a shared identity.'
              : 'Real relationships across recent cases — accused, victims, complainants, officers, and cross-case identity links.'}
          </p>
        </div>
        {caseId && (
          <Link
            href="/crime-network"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white cmd-panel px-3 py-2"
          >
            <X className="w-4 h-4 mr-1.5" /> Clear focus
          </Link>
        )}
      </div>

      {caseId && focusCase && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-sm text-red-300 flex items-center justify-between flex-wrap gap-2">
          <span>
            Focused on <span className="font-semibold text-white">{focusCase.CrimeNo || focusCase.CaseNo}</span>
            {' '}({focusCase.CrimeHead || 'Unclassified'})
          </span>
          <Link href={`/crimes/${caseId}`} className="text-red-400 hover:underline text-xs">
            Back to case details
          </Link>
        </div>
      )}

      {!caseId && (
        <form method="GET" className="cmd-panel p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">District</label>
            <select
              name="district_id"
              defaultValue={districtId || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2 min-w-[160px]"
            >
              <option value="">All Districts</option>
              {categories?.districts?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Crime Head</label>
            <select
              name="crime_head_id"
              defaultValue={crimeHeadId || ''}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2 min-w-[160px]"
            >
              <option value="">All Crime Heads</option>
              {categories?.crime_heads?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Cases in graph</label>
            <select
              name="limit_cases"
              defaultValue={limitCases}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2"
            >
              {[10, 25, 40, 60].map((n) => (
                <option key={n} value={n}>{n}</option>
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
      )}

      {error && (
        <div className="cmd-panel p-6 text-center text-zinc-500">{error}</div>
      )}

      {graph && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="hud-stat">
              <div className="cmd-eyebrow">Cases</div>
              <div className="hud-value text-white mt-2">{graph.total_cases}</div>
              <div className="hud-bar" />
            </div>
            <div className="hud-stat">
              <div className="cmd-eyebrow">Nodes</div>
              <div className="hud-value text-white mt-2">{graph.total_nodes}</div>
              <div className="hud-bar" />
            </div>
            <div className="hud-stat">
              <div className="cmd-eyebrow">Connections</div>
              <div className="hud-value text-white mt-2">{graph.total_edges}</div>
              <div className="hud-bar" />
            </div>
            <div className="hud-stat">
              <div className="cmd-eyebrow">Identity Links</div>
              <div className="hud-value text-orange-400 mt-2 glow-red">
                {graph.edges.filter((e: any) => e.relation === 'SAME_PERSON' || e.relation === 'SAME_BIOMETRIC').length}
              </div>
              <div className="hud-bar" style={{ background: 'linear-gradient(90deg, rgb(251 146 60), transparent)' }} />
            </div>
          </div>

          {graph.truncated && (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3 text-sm text-amber-300 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
              This graph was truncated to keep it readable. Narrow your filters to see everything.
            </div>
          )}

          <div className="cmd-panel p-2 relative overflow-hidden">
            <div className="radar-sweep opacity-60"></div>
            <div className="relative z-10">
              <NetworkGraph nodes={graph.nodes} edges={graph.edges} />
            </div>
          </div>

          <div className="text-xs text-zinc-500">
            Click a case node to open its case file. Click a person/officer node to highlight their connections.
            Orange dashed lines mark cases linked by a shared accused identity (same Person ID or biometric reference) —
            never inferred, only shown when the underlying records actually match.
          </div>
        </>
      )}
    </div>
  );
}
