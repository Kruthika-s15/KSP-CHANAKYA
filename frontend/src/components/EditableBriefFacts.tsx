"use client";
import { useState } from "react";
import { updateCase } from "@/lib/api";
import { Pencil, Save, X } from "lucide-react";
import toast from "react-hot-toast";

export default function EditableBriefFacts({
  caseId,
  initialFacts,
}: {
  caseId: string | number;
  initialFacts: string;
}) {
  const [editing, setEditing] = useState(false);
  const [facts, setFacts] = useState(initialFacts);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCase(caseId, { BriefFacts: facts });
      toast.success("Case details saved!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-6 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">Brief Facts</div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition"
          >
            <Pencil className="w-3 h-3" /> Edit
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
              onClick={() => { setEditing(false); setFacts(initialFacts); }}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          rows={6}
          className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500/50 rounded-lg p-4 text-sm text-zinc-300 leading-relaxed outline-none transition resize-y"
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
          {facts || "No detailed facts available for this case."}
        </div>
      )}
    </div>
  );
}
