"use client";
import { useState, useEffect } from "react";
import { updateCase, fetchCategories } from "@/lib/api";
import { Pencil, Save, X, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function EditableIncidentDetails({
  caseId,
  caseData,
}: {
  caseId: string | number;
  caseData: any;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any>(null);

  const [formData, setFormData] = useState({
    BriefFacts: caseData.BriefFacts || "",
    CaseCategoryID: caseData.CaseCategoryID || "",
    CrimeMajorHeadID: caseData.CrimeMajorHeadID || "",
    CrimeMinorHeadID: caseData.CrimeMinorHeadID || "",
    GravityOffenceID: caseData.GravityOffenceID || "",
    CaseStatusID: caseData.CaseStatusID || "",
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { BriefFacts: formData.BriefFacts };
      
      if (formData.CaseCategoryID) payload.CaseCategoryID = parseInt(formData.CaseCategoryID.toString());
      if (formData.CrimeMajorHeadID) payload.CrimeMajorHeadID = parseInt(formData.CrimeMajorHeadID.toString());
      if (formData.CrimeMinorHeadID) payload.CrimeMinorHeadID = parseInt(formData.CrimeMinorHeadID.toString());
      if (formData.GravityOffenceID) payload.GravityOffenceID = parseInt(formData.GravityOffenceID.toString());
      if (formData.CaseStatusID) payload.CaseStatusID = parseInt(formData.CaseStatusID.toString());

      await updateCase(caseId, payload);
      toast.success("Case details saved! Refreshing...");
      setEditing(false);
      window.location.reload(); // Quick way to refresh server components
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      BriefFacts: caseData.BriefFacts || "",
      CaseCategoryID: caseData.CaseCategoryID || "",
      CrimeMajorHeadID: caseData.CrimeMajorHeadID || "",
      CrimeMinorHeadID: caseData.CrimeMinorHeadID || "",
      GravityOffenceID: caseData.GravityOffenceID || "",
      CaseStatusID: caseData.CaseStatusID || "",
    });
  };

  return (
    <div className="cmd-panel overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between font-semibold text-white">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-red-500" />
          Incident Details
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition"
          >
            <Pencil className="w-3 h-3" /> Edit Case Details
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition disabled:opacity-50"
            >
              <Save className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Category</div>
            {!editing ? (
              <div className="text-sm font-medium text-white">{caseData.CaseCategory || 'N/A'}</div>
            ) : (
              <select
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white"
                value={formData.CaseCategoryID}
                onChange={(e) => setFormData({ ...formData, CaseCategoryID: e.target.value })}
              >
                <option value="">Select Category...</option>
                {categories?.case_categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Head</div>
            {!editing ? (
              <div className="text-sm font-medium text-white">{caseData.CrimeHead || 'N/A'}</div>
            ) : (
              <select
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white"
                value={formData.CrimeMajorHeadID}
                onChange={(e) => setFormData({ ...formData, CrimeMajorHeadID: e.target.value })}
              >
                <option value="">Select Crime Head...</option>
                {categories?.crime_heads?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Crime Sub-Head</div>
            {!editing ? (
              <div className="text-sm font-medium text-zinc-300">{caseData.CrimeSubHead || 'N/A'}</div>
            ) : (
              <select
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white"
                value={formData.CrimeMinorHeadID}
                onChange={(e) => setFormData({ ...formData, CrimeMinorHeadID: e.target.value })}
              >
                <option value="">Select Sub-Head...</option>
                {categories?.crime_sub_heads?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Gravity</div>
            {!editing ? (
              <div className="text-sm font-medium text-zinc-300">{caseData.Gravity || 'N/A'}</div>
            ) : (
              <select
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white"
                value={formData.GravityOffenceID}
                onChange={(e) => setFormData({ ...formData, GravityOffenceID: e.target.value })}
              >
                <option value="">Select Gravity...</option>
                {categories?.gravity_offences?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {editing && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Case Status</div>
              <select
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white"
                value={formData.CaseStatusID}
                onChange={(e) => setFormData({ ...formData, CaseStatusID: e.target.value })}
              >
                <option value="">Select Status...</option>
                {categories?.case_statuses?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Brief Facts</div>
          {!editing ? (
            <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              {caseData.BriefFacts || 'No detailed facts available for this case.'}
            </div>
          ) : (
            <textarea
              rows={6}
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500/50 rounded-lg p-4 text-sm text-zinc-300 leading-relaxed outline-none transition resize-y"
              value={formData.BriefFacts}
              onChange={(e) => setFormData({ ...formData, BriefFacts: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
