'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchBiometricSearch, fetchLinkedCases } from '@/lib/api';
import Link from 'next/link';
import { Fingerprint, Search, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import FingerprintScanner from '@/components/FingerprintScanner';
import BiometricModuleTabs from '@/components/BiometricModuleTabs';

export default function BiometricSearchPage() {
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref_id') || '';
  const accusedId = searchParams.get('accused_id') || '';

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (accusedId) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetchLinkedCases(accusedId);
          if (res) {
            setResult(res);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          } else {
            setError('No biometric records found for this accused person.');
          }
        } catch (err) {
          setError('No biometric records found for this accused person.');
        } finally {
          setLoading(false);
        }
      } else if (refId) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetchBiometricSearch(refId);
          if (res) {
            setResult(res);
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          } else {
            setError('Search failed. Please try again.');
          }
        } catch (err) {
          setError('Search failed. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setResult(null);
        setError(null);
      }
    }
    loadData();
  }, [refId, accusedId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="cmd-eyebrow mb-1">KSP // Identity Verification Unit</p>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Fingerprint className="w-6 h-6 mr-3 text-red-500" />
          Biometric Search
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Search a fingerprint, iris, or photo reference ID to find every accused
          record across every case file that shares that biometric signature.
        </p>
      </div>

      <FingerprintScanner />

      {/* ── Fingerprint + Facial Recognition tabs ───────────────────── */}
      <BiometricModuleTabs />

      <div className="ascii-rule" />

      <div ref={resultsRef} className="space-y-6">
        <div className="cmd-panel p-4">
          <form method="GET" className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                name="ref_id"
                defaultValue={refId}
                placeholder="Biometric reference ID (e.g. FP-00013)"
                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full pl-10 p-2.5"
              />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg flex items-center transition-colors"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Match
            </button>
          </form>
        </div>

        {accusedId && (
          <div className="text-xs text-zinc-500">
            Showing linked-case results for accused #{accusedId}.{' '}
            <Link href="/biometrics" className="text-red-400 hover:underline">
              Clear
            </Link>
          </div>
        )}

        {loading && (
          <div className="cmd-panel p-6 text-center text-zinc-400">
            Searching biometrics databases...
          </div>
        )}

        {!loading && error && (
          <div className="cmd-panel p-6 text-center text-zinc-500">
            {error}
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            <div
              className={`rounded-lg border p-4 flex items-center justify-between ${
                result.is_repeat_offender
                  ? 'bg-red-950/20 border-red-900/40'
                  : 'bg-emerald-950/20 border-emerald-900/40'
              }`}
            >
              <div className="flex items-center">
                {result.is_repeat_offender ? (
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mr-3" />
                )}
                <div>
                  <div className="font-semibold text-white">
                    {result.is_repeat_offender
                      ? 'Repeat offender pattern detected'
                      : 'No cross-case link found'}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {result.total_matches} biometric record
                    {result.total_matches === 1 ? '' : 's'} across {result.distinct_cases} case
                    {result.distinct_cases === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500 font-mono">{result.query_ref_id}</div>
            </div>

            <div className="cmd-panel overflow-hidden">
              <table className="w-full text-sm text-left text-zinc-300">
                <thead className="text-xs text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Accused</th>
                    <th className="px-6 py-4">Case</th>
                    <th className="px-6 py-4">Crime Head</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matches.length > 0 ? (
                    result.matches.map((m: any) => (
                      <tr
                        key={m.BiometricID}
                        className="bg-zinc-900 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{m.AccusedName}</div>
                          <div className="text-xs text-zinc-500">{m.BiometricType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{m.CrimeNo || m.CaseNo}</div>
                        </td>
                        <td className="px-6 py-4 text-red-400">{m.CrimeHead || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div>{m.PoliceStationName}</div>
                          <div className="text-xs text-zinc-500">{m.DistrictName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              m.CaseStatus?.toLowerCase().includes('closed')
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {m.CaseStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/crimes/${m.CaseMasterID}`}
                            className="text-red-500 hover:text-red-400 font-medium text-sm inline-flex items-center"
                          >
                            View Case <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                        No matches found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="cmd-panel p-10 flex flex-col items-center justify-center text-center overflow-hidden relative min-h-[280px]">
            <div className="scan-rings">
              <span /><span /><span />
            </div>
            <Fingerprint className="w-16 h-16 text-red-400 relative z-10" strokeWidth={1} />
            <p className="font-data text-[11px] tracking-widest text-red-500/70 mt-5 relative z-10">AWAITING BIOMETRIC INPUT</p>
            <p className="text-zinc-500 text-sm mt-2 relative z-10">Enter a biometric reference ID above to search across all case files.</p>
          </div>
        )}
      </div>
    </div>
  );
}
