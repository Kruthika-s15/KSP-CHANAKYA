import { fetchCase, fetchCasePeople, fetchChargesheet, fetchArrests, fetchSections, fetchStatusHistory } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, FileText, Users, ShieldAlert, Fingerprint, Gavel, Siren, History, ScrollText, FileOutput, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function CaseDetailsPage({
  params,
}: {
  params: { case_id: string };
}) {
  const { case_id } = await params;

  const caseData = await fetchCase(case_id);
  if (!caseData) {
    notFound();
  }

  const peopleData = await fetchCasePeople(case_id).catch(() => ({
    complainants: [], victims: [], accused: []
  }));

  const [chargesheet, arrests, sections, statusHistory] = await Promise.all([
    fetchChargesheet(case_id).catch(() => []),
    fetchArrests(case_id).catch(() => []),
    fetchSections(case_id).catch(() => []),
    fetchStatusHistory(case_id).catch(() => []),
  ]);

  const isClosed = caseData.CaseStatus?.toLowerCase().includes('closed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/crimes" className="p-2 cmd-panel text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            {caseData.CrimeNo || caseData.CaseNo}
            <span className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded ${isClosed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {caseData.CaseStatus || 'Pending'}
            </span>
          </h1>
          <div className="text-sm text-zinc-400 flex items-center mt-1">
            <Calendar className="w-4 h-4 mr-1" /> Registered: {caseData.CrimeRegisteredDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <FileText className="w-5 h-5 mr-2 text-red-500" />
              Incident Details
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Category</div>
                  <div className="text-sm font-medium text-white">{caseData.CaseCategory || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Head</div>
                  <div className="text-sm font-medium text-white">{caseData.CrimeHead || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Sub-Head</div>
                  <div className="text-sm font-medium text-zinc-300">{caseData.CrimeSubHead || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Gravity</div>
                  <div className="text-sm font-medium text-zinc-300">{caseData.Gravity || 'N/A'}</div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Brief Facts</div>
                <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                  {caseData.BriefFacts || 'No detailed facts available for this case.'}
                </div>
              </div>
            </div>
          </div>

          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <Users className="w-5 h-5 mr-2 text-purple-500" />
              People Involved
            </div>
            <div className="p-0">
              {/* Accused */}
              <div className="p-4 border-b border-zinc-800/50 bg-red-950/10">
                <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Accused ({peopleData.accused?.length || 0})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {peopleData.accused?.map((p: any) => (
                    <div key={p.id} className="bg-zinc-950 border border-red-900/30 p-3 rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">{p.name}</div>
                        <div className="text-xs text-zinc-500">Age: {p.age || 'N/A'}</div>
                      </div>
                      <Link
                        href={`/biometric?accused_id=${p.id}`}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center whitespace-nowrap ml-2"
                      >
                        <Fingerprint className="w-3.5 h-3.5 mr-1" /> Check Match
                      </Link>
                    </div>
                  ))}
                  {(!peopleData.accused || peopleData.accused.length === 0) && (
                    <div className="text-sm text-zinc-500 italic">No accused details found.</div>
                  )}
                </div>
              </div>

              {/* Victims */}
              <div className="p-4 border-b border-zinc-800/50">
                <h3 className="text-sm font-medium text-emerald-400 mb-3">Victims ({peopleData.victims?.length || 0})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {peopleData.victims?.map((p: any) => (
                    <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded flex items-center justify-between">
                      <div className="text-sm text-white font-medium">{p.name}</div>
                      <div className="text-xs text-zinc-500">Age: {p.age || 'N/A'}</div>
                    </div>
                  ))}
                  {(!peopleData.victims || peopleData.victims.length === 0) && (
                    <div className="text-sm text-zinc-500 italic">No victim details found.</div>
                  )}
                </div>
              </div>

              {/* Complainants */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-red-400 mb-3">Complainants ({peopleData.complainants?.length || 0})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {peopleData.complainants?.map((p: any) => (
                    <div key={p.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded flex items-center justify-between">
                      <div className="text-sm text-white font-medium">{p.name}</div>
                      <div className="text-xs text-zinc-500">Age: {p.age || 'N/A'}</div>
                    </div>
                  ))}
                  {(!peopleData.complainants || peopleData.complainants.length === 0) && (
                    <div className="text-sm text-zinc-500 italic">No complainant details found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <Gavel className="w-5 h-5 mr-2 text-amber-500" />
              Legal Sections
            </div>
            <div className="p-4">
              {sections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sections.map((s: any, i: number) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                      <div className="text-sm font-medium text-white">{s.ActCode} &sect; {s.SectionCode}</div>
                      <div className="text-xs text-zinc-500">{s.SectionDescription || s.ActDescription}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500 italic">No sections recorded for this case.</div>
              )}
            </div>
          </div>

          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <Siren className="w-5 h-5 mr-2 text-red-500" />
              Arrests / Surrenders
            </div>
            <div className="p-4 space-y-2">
              {arrests.length > 0 ? (
                arrests.map((a: any) => (
                  <div key={a.ArrestSurrenderID} className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-white">{a.AccusedName || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">
                        {a.IsAccused ? 'Arrested' : 'Surrendered'} on {a.ArrestSurrenderDate || 'N/A'}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">IO: {a.InvestigatingOfficerName || 'N/A'}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-500 italic">No arrest/surrender records found.</div>
              )}
            </div>
          </div>

          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <ScrollText className="w-5 h-5 mr-2 text-red-400" />
              Chargesheet
            </div>
            <div className="p-4 space-y-2">
              {chargesheet.length > 0 ? (
                chargesheet.map((cs: any) => (
                  <div key={cs.CSID} className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {cs.cstype === 'F' ? 'Final Chargesheet' : cs.cstype || 'Chargesheet'}
                      </div>
                      <div className="text-xs text-zinc-500">Filed on {cs.csdate ? new Date(cs.csdate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div className="text-xs text-zinc-400">IO: {cs.InvestigatingOfficerName || 'N/A'}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-500 italic">No chargesheet filed yet.</div>
              )}
            </div>
          </div>

          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <History className="w-5 h-5 mr-2 text-zinc-400" />
              Case Status History
            </div>
            <div className="p-4">
              {statusHistory.length > 0 ? (
                <ol className="relative border-l border-zinc-800 ml-2 space-y-4">
                  {statusHistory.map((h: any) => (
                    <li key={h.CaseStatusHistoryID} className="ml-4">
                      <div className="absolute w-2 h-2 bg-red-500 rounded-full mt-1.5 -left-1"></div>
                      <div className="text-sm font-medium text-white">{h.CaseStatusName}</div>
                      <div className="text-xs text-zinc-500">{new Date(h.ChangedDate).toLocaleString()}</div>
                      {h.Remarks && <div className="text-xs text-zinc-400 mt-1">{h.Remarks}</div>}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-zinc-500 italic">No status history recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Map & Metadata */}
        <div className="space-y-6">
          <div className="cmd-panel overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center font-semibold text-white">
              <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
              Jurisdiction & Location
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Police Station</div>
                <div className="text-sm font-medium text-white">{caseData.PoliceStationName}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">District</div>
                <div className="text-sm font-medium text-zinc-300">{caseData.DistrictName}</div>
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Geolocation (Synthetic)</div>
                {caseData.latitude && caseData.longitude ? (
                  <div className="h-40 bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="text-center z-10 relative">
                      <MapPin className="w-8 h-8 text-red-500 mx-auto mb-1 animate-bounce" />
                      <div className="text-xs text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded">
                        {caseData.latitude.toFixed(4)}, {caseData.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">No GPS coordinates available.</div>
                )}
              </div>
            </div>
          </div>

          {/* Intelligence Actions */}
          <div className="cmd-panel p-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Intelligence Actions</div>
            <div className="space-y-2">
              <Link
                href={`/crimes/${case_id}/report`}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-red-600 hover:bg-red-700 text-sm text-white rounded transition-colors"
              >
                <FileOutput className="w-4 h-4" />
                <span>Generate Investigation Report PDF</span>
              </Link>
              {peopleData.accused && peopleData.accused.length > 0 ? (
                (() => {
                  const accused = peopleData.accused[0];
                  return (
                    <Link
                      href={`/biometrics?ref_id=${accused.BiometricRefID || ''}&accused_id=${accused.AccusedMasterID || accused.id}`}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded transition-colors"
                    >
                      <Fingerprint className="w-4 h-4 text-zinc-400" />
                      <span>Run Biometric Match</span>
                    </Link>
                  );
                })()
              ) : (
                <button disabled className="w-full flex items-center justify-center space-x-2 py-2 bg-zinc-800/50 text-sm text-zinc-500 rounded cursor-not-allowed">
                  <Fingerprint className="w-4 h-4" />
                  <span>No accused to match</span>
                </button>
              )}
              <Link
                href={`/crime-network?case_id=${case_id}`}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded transition-colors"
              >
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Related Intelligence (Network)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
