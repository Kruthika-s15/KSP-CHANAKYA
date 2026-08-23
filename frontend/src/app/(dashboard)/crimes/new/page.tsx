"use client";
import { useState, useEffect } from "react";
import { fetchCategories, createCase, uploadEvidence } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, X, File, ShieldAlert, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    CrimeNo: "",
    CaseNo: "",
    CrimeRegisteredDate: new Date().toISOString().split("T")[0],
    IncidentFromDate: "",
    IncidentToDate: "",
    latitude: "12.9716",
    longitude: "77.5946",
    BriefFacts: "",
    CrimeMajorHeadID: "",
    CrimeMinorHeadID: "",
    CaseCategoryID: "",
    GravityOffenceID: "",
    PoliceStationID: "",
  });

  const [complainants, setComplainants] = useState([{ name: "", age: "" }]);
  const [victims, setVictims] = useState([{ name: "", age: "" }]);
  const [accused, setAccused] = useState([{ name: "", age: "" }]);
  const [evidenceFiles, setEvidenceFiles] = useState<{ file: globalThis.File; description: string }[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleArrayChange = (setter: any, index: number, field: string, value: string) => {
    setter((prev: any) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const addArrayItem = (setter: any) => setter((prev: any) => [...prev, { name: "", age: "" }]);
  const removeArrayItem = (setter: any, index: number) => setter((prev: any) => prev.filter((_: any, i: number) => i !== index));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ file: f, description: "" }));
      setEvidenceFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        IncidentFromDate: formData.IncidentFromDate ? new Date(formData.IncidentFromDate).toISOString() : null,
        IncidentToDate: formData.IncidentToDate ? new Date(formData.IncidentToDate).toISOString() : null,
        CrimeMajorHeadID: parseInt(formData.CrimeMajorHeadID),
        CrimeMinorHeadID: parseInt(formData.CrimeMinorHeadID) || null,
        CaseCategoryID: parseInt(formData.CaseCategoryID) || null,
        GravityOffenceID: parseInt(formData.GravityOffenceID) || null,
        PoliceStationID: parseInt(formData.PoliceStationID) || null,
        complainants: complainants.filter(c => c.name).map(c => ({ name: c.name, age: parseInt(c.age) || null })),
        victims: victims.filter(v => v.name).map(v => ({ name: v.name, age: parseInt(v.age) || null })),
        accused: accused.filter(a => a.name).map(a => ({ name: a.name, age: parseInt(a.age) || null })),
      };

      // 1. Create Case
      const caseRes = await createCase(payload);
      
      // 2. Upload Evidence
      if (evidenceFiles.length > 0) {
        toast.loading("Uploading evidence...", { id: "upload" });
        // Upload each file sequentially with its description
        for (const ev of evidenceFiles) {
          await uploadEvidence(caseRes.CaseMasterID, [ev.file], ev.description);
        }
        toast.success("Evidence uploaded", { id: "upload" });
      }

      toast.success("FIR Registered Successfully");
      router.push(`/crimes/${caseRes.CaseMasterID}`);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <ShieldAlert className="w-6 h-6 mr-3 text-red-500" />
        <h1 className="text-2xl font-bold font-data tracking-wider uppercase">Register New FIR</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Details */}
        <div className="cmd-panel p-6">
          <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 text-zinc-300">Case Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Crime No (FIR Number)</label>
              <input required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.CrimeNo} onChange={e => setFormData({...formData, CrimeNo: e.target.value})} placeholder="e.g. 1044300062026..." />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Case No (Internal)</label>
              <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.CaseNo} onChange={e => setFormData({...formData, CaseNo: e.target.value})} placeholder="e.g. 202600123" />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Registration Date</label>
              <input type="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.CrimeRegisteredDate} onChange={e => setFormData({...formData, CrimeRegisteredDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Police Station</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.PoliceStationID} onChange={e => setFormData({...formData, PoliceStationID: e.target.value})}>
                <option value="">Select PS...</option>
                {categories?.police_stations.map((ps: any) => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-data text-zinc-500 mb-1">Brief Facts (FIR Summary)</label>
              <textarea rows={4} required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.BriefFacts} onChange={e => setFormData({...formData, BriefFacts: e.target.value})} placeholder="Describe the incident..." />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="cmd-panel p-6">
          <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 text-zinc-300">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Crime Head (Major)</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.CrimeMajorHeadID} onChange={e => setFormData({...formData, CrimeMajorHeadID: e.target.value})}>
                <option value="">Select Major Head...</option>
                {categories?.crime_heads.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Case Category</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white" value={formData.CaseCategoryID} onChange={e => setFormData({...formData, CaseCategoryID: e.target.value})}>
                <option value="">Select Category...</option>
                {categories?.case_categories.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* People */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Complainants */}
          <div className="cmd-panel p-4">
            <h3 className="font-semibold text-zinc-300 mb-3 flex items-center justify-between">
              Complainants
              <button type="button" onClick={() => addArrayItem(setComplainants)} className="text-zinc-400 hover:text-white p-1"><Plus className="w-4 h-4"/></button>
            </h3>
            {complainants.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <input placeholder="Name" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" value={c.name} onChange={e => handleArrayChange(setComplainants, i, "name", e.target.value)} />
                <input placeholder="Age" type="number" className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" value={c.age} onChange={e => handleArrayChange(setComplainants, i, "age", e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setComplainants, i)} className="text-red-500/70 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>

          {/* Victims */}
          <div className="cmd-panel p-4">
            <h3 className="font-semibold text-zinc-300 mb-3 flex items-center justify-between">
              Victims
              <button type="button" onClick={() => addArrayItem(setVictims)} className="text-zinc-400 hover:text-white p-1"><Plus className="w-4 h-4"/></button>
            </h3>
            {victims.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <input placeholder="Name" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" value={v.name} onChange={e => handleArrayChange(setVictims, i, "name", e.target.value)} />
                <input placeholder="Age" type="number" className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" value={v.age} onChange={e => handleArrayChange(setVictims, i, "age", e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setVictims, i)} className="text-red-500/70 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>

          {/* Accused */}
          <div className="cmd-panel p-4 border border-red-900/30">
            <h3 className="font-semibold text-red-400 mb-3 flex items-center justify-between">
              Accused
              <button type="button" onClick={() => addArrayItem(setAccused)} className="text-red-400 hover:text-red-300 p-1"><Plus className="w-4 h-4"/></button>
            </h3>
            {accused.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <input placeholder="Name" className="flex-1 bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-white" value={a.name} onChange={e => handleArrayChange(setAccused, i, "name", e.target.value)} />
                <input placeholder="Age" type="number" className="w-16 bg-red-950/20 border border-red-900/50 rounded px-2 py-1 text-sm text-white" value={a.age} onChange={e => handleArrayChange(setAccused, i, "age", e.target.value)} />
                <button type="button" onClick={() => removeArrayItem(setAccused, i)} className="text-red-500/70 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Upload */}
        <div className="cmd-panel p-6 border border-emerald-900/30">
          <h2 className="text-lg font-semibold border-b border-emerald-900/30 pb-2 mb-4 text-emerald-400 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Case Evidence (Optional)
          </h2>
          
          <div className="space-y-4">
            <label className="flex justify-center w-full h-32 px-4 transition bg-zinc-900/50 border-2 border-zinc-700 border-dashed rounded-md appearance-none cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/20 focus:outline-none">
                <span className="flex items-center space-x-2">
                    <Upload className="w-6 h-6 text-zinc-500" />
                    <span className="font-medium text-zinc-500">
                        Drop files to upload, or browse
                    </span>
                </span>
                <input type="file" name="file_upload" className="hidden" multiple onChange={handleFileChange} />
            </label>

            {evidenceFiles.length > 0 && (
              <div className="space-y-2">
                {evidenceFiles.map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 bg-zinc-900 p-3 rounded border border-zinc-800">
                    <File className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1 truncate">
                      <div className="text-sm text-white truncate">{ev.file.name}</div>
                      <div className="text-xs text-zinc-500">{(ev.file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <input 
                      placeholder="Add brief description..." 
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white"
                      value={ev.description}
                      onChange={(e) => setEvidenceFiles(prev => {
                        const copy = [...prev];
                        copy[i].description = e.target.value;
                        return copy;
                      })}
                    />
                    <button type="button" onClick={() => setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-red-500 text-zinc-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Registering Case..." : "Register FIR"}
          </button>
        </div>

      </form>
    </div>
  );
}
