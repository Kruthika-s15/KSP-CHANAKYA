import { fetchCase, fetchCasePeople, fetchChargesheet, fetchArrests, fetchSections, fetchStatusHistory } from '@/lib/api';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InvestigationReportPage({
  params,
}: {
  params: { case_id: string };
}) {
  const { case_id } = await params;

  const caseData = await fetchCase(case_id);
  if (!caseData) notFound();

  const peopleData = await fetchCasePeople(case_id).catch(() => ({ complainants: [], victims: [], accused: [] }));
  const [chargesheet, arrests, sections, statusHistory] = await Promise.all([
    fetchChargesheet(case_id).catch(() => []),
    fetchArrests(case_id).catch(() => []),
    fetchSections(case_id).catch(() => []),
    fetchStatusHistory(case_id).catch(() => []),
  ]);

  const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="bg-zinc-100 min-h-screen py-8 print:bg-white print:py-0">
      {/* Screen-only toolbar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-2">
        {/* Back Button */}
        <Link className="flex items-center gap-2 text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors" href={`/crimes/${case_id}`}>
          <ArrowLeft className="w-4 h-4" />
          <span> Back to Case</span>
        </Link>

        {/* Existing Print Button */}
        <PrintButton />
      </div>

      {/* Report sheet, sized to A4 */}
      <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 shadow-lg print:shadow-none p-10 print:p-8 font-serif">
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Government of Karnataka</div>
            <div className="text-xl font-bold">Karnataka State Police</div>
            <div className="text-sm text-zinc-600">AI Crime Intelligence Platform — Investigation Report</div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>Generated: {generatedAt}</div>
            <div>Report Ref: RPT-{caseData.CaseMasterID}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
          <Field label="FIR / Crime No" value={caseData.CrimeNo} />
          <Field label="Case No" value={caseData.CaseNo} />
          <Field label="Registered Date" value={caseData.CrimeRegisteredDate} />
          <Field label="Case Status" value={caseData.CaseStatus} />
          <Field label="Crime Category" value={caseData.CaseCategory} />
          <Field label="Crime Head / Sub-Head" value={[caseData.CrimeHead, caseData.CrimeSubHead].filter(Boolean).join(' / ')} />
          <Field label="Gravity" value={caseData.Gravity} />
          <Field label="Police Station" value={caseData.PoliceStationName} />
          <Field label="District" value={caseData.DistrictName} />
          <Field
            label="Location (GPS)"
            value={caseData.latitude && caseData.longitude ? `${caseData.latitude.toFixed(4)}, ${caseData.longitude.toFixed(4)}` : 'Not recorded'}
          />
        </div>

        <Section title="Brief Facts of the Case">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {caseData.BriefFacts || 'No detailed facts recorded for this case.'}
          </p>
        </Section>

        <Section title="Acts & Sections Invoked">
          {sections.length > 0 ? (
            <ul className="text-sm space-y-1">
              {sections.map((s: any, i: number) => (
                <li key={i}>
                  <strong>{s.ActCode} §{s.SectionCode}</strong> — {s.SectionDescription || s.ActDescription || 'N/A'}
                </li>
              ))}
            </ul>
          ) : <Empty text="No sections recorded." />}
        </Section>

        <Section title="Persons Involved">
          <PersonTable title="Complainant(s)" people={peopleData.complainants} />
          <PersonTable title="Victim(s)" people={peopleData.victims} />
          <PersonTable title="Accused" people={peopleData.accused} />
        </Section>

        <Section title="Arrests / Surrenders">
          {arrests.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-300 text-left text-xs uppercase text-zinc-500">
                  <th className="py-1 pr-2">Name</th>
                  <th className="py-1 pr-2">Type</th>
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1">Investigating Officer</th>
                </tr>
              </thead>
              <tbody>
                {arrests.map((a: any) => (
                  <tr key={a.ArrestSurrenderID} className="border-b border-zinc-100">
                    <td className="py-1.5 pr-2">{a.AccusedName || 'Unknown'}</td>
                    <td className="py-1.5 pr-2">{a.IsAccused ? 'Arrested' : 'Surrendered'}</td>
                    <td className="py-1.5 pr-2">{a.ArrestSurrenderDate || 'N/A'}</td>
                    <td className="py-1.5">{a.InvestigatingOfficerName || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty text="No arrest/surrender records." />}
        </Section>

        <Section title="Chargesheet Filings">
          {chargesheet.length > 0 ? (
            <ul className="text-sm space-y-1">
              {chargesheet.map((cs: any) => (
                <li key={cs.CSID}>
                  {cs.cstype === 'F' ? 'Final Chargesheet' : cs.cstype || 'Chargesheet'} filed on{' '}
                  {cs.csdate ? new Date(cs.csdate).toLocaleDateString() : 'N/A'} by {cs.InvestigatingOfficerName || 'N/A'}
                </li>
              ))}
            </ul>
          ) : <Empty text="No chargesheet filed yet." />}
        </Section>

        <Section title="Case Status Timeline">
          {statusHistory.length > 0 ? (
            <ol className="text-sm space-y-1">
              {statusHistory.map((h: any) => (
                <li key={h.CaseStatusHistoryID}>
                  <strong>{h.CaseStatusName}</strong> — {new Date(h.ChangedDate).toLocaleString()}
                  {h.Remarks ? ` (${h.Remarks})` : ''}
                </li>
              ))}
            </ol>
          ) : <Empty text="No status history recorded." />}
        </Section>

        <div className="mt-10 pt-4 border-t border-zinc-300 flex justify-between text-xs text-zinc-500">
          <span>This is a system-generated investigation summary from the KSP AI Crime Intelligence Platform. Not a certified legal document.</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="font-medium">{value || 'N/A'}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 break-inside-avoid">
      <div className="text-sm font-bold uppercase tracking-wide border-b border-zinc-300 pb-1 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-zinc-400 italic">{text}</p>;
}

function PersonTable({ title, people }: { title: string; people?: any[] }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-zinc-600 mb-1">{title} ({people?.length || 0})</div>
      {people && people.length > 0 ? (
        <ul className="text-sm grid grid-cols-2 gap-x-6">
          {people.map((p) => (
            <li key={p.id}>{p.name} {p.age ? `(Age ${p.age})` : ''}</li>
          ))}
        </ul>
      ) : <Empty text="None recorded." />}
    </div>
  );
}
