'use client';

import { useState, useEffect } from 'react';
import { FileText, Edit2, X, Save } from 'lucide-react';
import { fetchCategories, updateCase } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function IncidentDetailsPanel({ caseData }: { caseData: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any>({
    crime_heads: [], crime_sub_heads: [], case_categories: [], gravity_offences: [], case_statuses: []
  });
  const [formData, setFormData] = useState({
    BriefFacts: caseData.BriefFacts || '',
    CrimeMajorHeadID: '',
    CrimeMinorHeadID: '',
    CaseCategoryID: '',
    GravityOffenceID: '',
    CaseStatusID: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && categories.crime_heads.length === 0) {
      fetchCategories().then(setCategories).catch(console.error);
    }
  }, [isEditing]);

  useEffect(() => {
    if (categories.crime_heads.length > 0) {
      setFormData({
        BriefFacts: caseData.BriefFacts || '',
        CrimeMajorHeadID: categories.crime_heads.find((c: any) => c.name === caseData.CrimeHead)?.id?.toString() || '',
        CrimeMinorHeadID: categories.crime_sub_heads.find((c: any) => c.name === caseData.CrimeSubHead)?.id?.toString() || '',
        CaseCategoryID: categories.case_categories.find((c: any) => c.name === caseData.CaseCategory)?.id?.toString() || '',
        GravityOffenceID: categories.gravity_offences.find((c: any) => c.name === caseData.Gravity)?.id?.toString() || '',
        CaseStatusID: categories.case_statuses.find((c: any) => c.name === caseData.CaseStatus)?.id?.toString() || ''
      });
    }
  }, [categories, caseData]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload: any = { BriefFacts: formData.BriefFacts };
      if (formData.CrimeMajorHeadID) payload.CrimeMajorHeadID = parseInt(formData.CrimeMajorHeadID);
      if (formData.CrimeMinorHeadID) payload.CrimeMinorHeadID = parseInt(formData.CrimeMinorHeadID);
      if (formData.CaseCategoryID) payload.CaseCategoryID = parseInt(formData.CaseCategoryID);
      if (formData.GravityOffenceID) payload.GravityOffenceID = parseInt(formData.GravityOffenceID);
      if (formData.CaseStatusID) payload.CaseStatusID = parseInt(formData.CaseStatusID);
      
      await updateCase(caseData.CaseMasterID, payload);
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to update case');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="cmd-panel overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between font-semibold text-white">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-red-500" />
            Incident Details
          </div>
          <button onClick={() => setIsEditing(true)} className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded">
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
          </button>
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
    );
  }

  return (
    <div className="cmd-panel overflow-hidden border-blue-500/30">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between font-semibold text-white bg-blue-900/10">
        <div className="flex items-center text-blue-400">
          <Edit2 className="w-5 h-5 mr-2" />
          Editing Incident Details
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsEditing(false)} className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded" disabled={isLoading}>
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </button>
          <button onClick={handleSave} className="flex items-center text-xs text-white transition-colors bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded" disabled={isLoading}>
            <Save className="w-3.5 h-3.5 mr-1" /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-data text-zinc-500 mb-1">Crime Category</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none" value={formData.CaseCategoryID} onChange={e => setFormData({ ...formData, CaseCategoryID: e.target.value })}>
              <option value="">Select Category</option>
              {categories.case_categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-data text-zinc-500 mb-1">Crime Head</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none" value={formData.CrimeMajorHeadID} onChange={e => setFormData({ ...formData, CrimeMajorHeadID: e.target.value })}>
              <option value="">Select Head</option>
              {categories.crime_heads.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-data text-zinc-500 mb-1">Crime Sub-Head</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none" value={formData.CrimeMinorHeadID} onChange={e => setFormData({ ...formData, CrimeMinorHeadID: e.target.value })}>
              <option value="">Select Sub-Head</option>
              {categories.crime_sub_heads.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-data text-zinc-500 mb-1">Gravity</label>
            <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none" value={formData.GravityOffenceID} onChange={e => setFormData({ ...formData, GravityOffenceID: e.target.value })}>
              <option value="">Select Gravity</option>
              {categories.gravity_offences.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 border-t border-zinc-800 pt-4">
            <label className="block text-xs font-data text-zinc-500 mb-1">Case Status</label>
            <select className="w-1/2 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none" value={formData.CaseStatusID} onChange={e => setFormData({ ...formData, CaseStatusID: e.target.value })}>
              <option value="">Select Status</option>
              {categories.case_statuses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">Changing the status will add a new entry to the Status History.</p>
          </div>
        </div>
        <div className="pt-6 border-t border-zinc-800">
          <label className="block text-xs font-data text-zinc-500 mb-2">Brief Facts</label>
          <textarea 
            rows={5}
            className="w-full bg-zinc-900 border border-zinc-800 rounded p-4 text-sm text-white focus:border-blue-500/50 outline-none leading-relaxed resize-y"
            value={formData.BriefFacts}
            onChange={e => setFormData({ ...formData, BriefFacts: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
