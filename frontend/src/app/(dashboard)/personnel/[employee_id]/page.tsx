import { fetchPersonnel } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Briefcase, CalendarDays } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function PersonnelDetailPage({
  params,
}: {
  params: { employee_id: string };
}) {
  const { employee_id } = await params;
  const emp = await fetchPersonnel(employee_id);
  if (!emp) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link
          href="/personnel"
          className="p-2 cmd-panel text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-red-500" />
            {emp.FirstName}
          </h1>
          <div className="text-sm text-zinc-400 mt-1">
            {emp.RankName} &middot; {emp.DesignationName}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cmd-panel p-6 space-y-4">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center">
            <Briefcase className="w-4 h-4 mr-2" /> Posting
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">District</div>
            <div className="text-sm font-medium text-white">{emp.DistrictName || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Unit</div>
            <div className="text-sm font-medium text-white">{emp.UnitName || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">KGID</div>
            <div className="text-sm font-medium text-zinc-300">{emp.KGID || 'N/A'}</div>
          </div>
        </div>

        <div className="cmd-panel p-6 space-y-4">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center">
            <CalendarDays className="w-4 h-4 mr-2" /> Service Record
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date of Birth</div>
            <div className="text-sm font-medium text-white">{emp.EmployeeDOB || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Appointment Date</div>
            <div className="text-sm font-medium text-white">{emp.AppointmentDate || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="cmd-panel p-6">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Caseload</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-amber-500/10 border border-amber-900/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{emp.active_case_count}</div>
            <div className="text-xs text-zinc-400 mt-1">Active Cases</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-900/30 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-emerald-500">{emp.closed_case_count}</div>
            <div className="text-xs text-zinc-400 mt-1">Closed Cases</div>
          </div>
        </div>
      </div>
    </div>
  );
}
