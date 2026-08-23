"use client";
import { useState, useEffect, useRef } from "react";
import { fetchCategories, createCase, uploadEvidence, uploadBiometricFile } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Upload, X, File, ShieldAlert, Plus, Trash2, Fingerprint, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PersonEntry {
  name: string;
  age: string;
  fingerprintFile?: globalThis.File | null;
  unknownCount?: string;
  ageRange?: string;
}

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>(null);

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

  const [complainants, setComplainants] = useState<PersonEntry[]>([{ name: "", age: "" }]);
  const [victims, setVictims] = useState<PersonEntry[]>([{ name: "", age: "" }]);
  const [accused, setAccused] = useState<PersonEntry[]>([{ name: "", age: "", fingerprintFile: null }]);
  const [evidenceFiles, setEvidenceFiles] = useState<{ file: globalThis.File; description: string }[]>([]);

  // Refs for hidden fingerprint file inputs
  const fpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleArrayChange = (setter: any, index: number, field: string, value: any) => {
    setter((prev: PersonEntry[]) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addPerson = (setter: any, withFp = false) =>
    setter((prev: PersonEntry[]) => [...prev, { name: "", age: "", ...(withFp ? { fingerprintFile: null } : {}) }]);

  const removePerson = (setter: any, index: number) =>
    setter((prev: PersonEntry[]) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ file: f, description: "" }));
      setEvidenceFiles(prev => [...prev, ...newFiles]);
      e.target.value = ""; // reset so same file can be added again
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || 12.9716,
        longitude: parseFloat(formData.longitude) || 77.5946,
        IncidentFromDate: formData.IncidentFromDate ? new Date(formData.IncidentFromDate).toISOString() : null,
        IncidentToDate: formData.IncidentToDate ? new Date(formData.IncidentToDate).toISOString() : null,
        CrimeMajorHeadID: parseInt(formData.CrimeMajorHeadID) || null,
        CrimeMinorHeadID: parseInt(formData.CrimeMinorHeadID) || null,
        CaseCategoryID: parseInt(formData.CaseCategoryID) || null,
        GravityOffenceID: parseInt(formData.GravityOffenceID) || null,
        PoliceStationID: parseInt(formData.PoliceStationID) || null,
        complainants: complainants.filter(c => c.name.trim()).map(c => ({ name: c.name, age: parseInt(c.age) || null })),
        victims: victims.filter(v => v.name.trim()).map(v => ({ name: v.name, age: parseInt(v.age) || null })),
        accused: accused.filter(a => a.name.trim()).map(a => {
          if (a.name.toLowerCase() === "unknown") {
            const countStr = a.unknownCount ? ` (${a.unknownCount} persons)` : "";
            const ageRangeStr = a.ageRange ? ` [Age: ${a.ageRange}]` : "";
            return { name: `Unknown${countStr}${ageRangeStr}`, age: null };
          }
          return { name: a.name, age: parseInt(a.age) || null };
        }),
      };

      // 1. Create the Case
      toast.loading("Creating case...", { id: "fir" });
      const caseRes = await createCase(payload);
      toast.success(`Case ${caseRes.CrimeNo || caseRes.CaseMasterID} created!`, { id: "fir" });

      // 2. Upload fingerprints for each accused
      const accusedWithFp = accused.filter(a => a.name.trim() && a.fingerprintFile);
      if (accusedWithFp.length > 0 && caseRes.accused?.length > 0) {
        toast.loading("Uploading fingerprints to dataset...", { id: "fp" });
        for (let i = 0; i < accusedWithFp.length; i++) {
          const matchingAccused = caseRes.accused.find(
            (ca: any) => ca.name === accusedWithFp[i].name
          );
          if (matchingAccused && accusedWithFp[i].fingerprintFile) {
            try {
              await uploadBiometricFile(matchingAccused.id, accusedWithFp[i].fingerprintFile!);
            } catch (err) {
              console.error("Fingerprint upload failed for", matchingAccused.name, err);
            }
          }
        }
        toast.success("Fingerprints uploaded to dataset!", { id: "fp" });
      }

      // 3. Upload evidence files
      if (evidenceFiles.length > 0) {
        toast.loading("Uploading evidence files...", { id: "ev" });
        for (const ev of evidenceFiles) {
          await uploadEvidence(caseRes.CaseMasterID, [ev.file], ev.description);
        }
        toast.success("Evidence uploaded!", { id: "ev" });
      }

      toast.success("FIR Registered Successfully! Redirecting...");
      router.push(`/crimes/${caseRes.CaseMasterID}`);
    } catch (err: any) {
      console.error("FIR registration error:", err);
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

        {/* ── Section 1: Case Information ── */}
        <div className="cmd-panel p-6">
          <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 text-zinc-300">Case Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Crime No (FIR Number) *</label>
              <input required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CrimeNo} onChange={e => setFormData({ ...formData, CrimeNo: e.target.value })} placeholder="e.g. 1044300062026" />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Case No (Internal)</label>
              <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CaseNo} onChange={e => setFormData({ ...formData, CaseNo: e.target.value })} placeholder="e.g. 202600123" />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Registration Date *</label>
              <input type="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CrimeRegisteredDate} onChange={e => setFormData({ ...formData, CrimeRegisteredDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Police Station *</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.PoliceStationID} onChange={e => setFormData({ ...formData, PoliceStationID: e.target.value })}>
                <option value="">Select PS...</option>
                {categories?.police_stations.map((ps: any) => <option key={ps.id} value={ps.id}>{ps.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Incident From Date</label>
              <input type="datetime-local" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.IncidentFromDate} onChange={e => setFormData({ ...formData, IncidentFromDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Incident To Date</label>
              <input type="datetime-local" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.IncidentToDate} onChange={e => setFormData({ ...formData, IncidentToDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-data text-zinc-500 mb-1">Brief Facts (FIR Summary) *</label>
              <textarea rows={4} required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.BriefFacts} onChange={e => setFormData({ ...formData, BriefFacts: e.target.value })} placeholder="Describe the incident in detail..." />
            </div>
          </div>
        </div>

        {/* ── Section 2: Classification ── */}
        <div className="cmd-panel p-6">
          <h2 className="text-lg font-semibold border-b border-white/10 pb-2 mb-4 text-zinc-300">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Crime Head (Major) *</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CrimeMajorHeadID} onChange={e => setFormData({ ...formData, CrimeMajorHeadID: e.target.value })}>
                <option value="">Select Major Head...</option>
                {categories?.crime_heads.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Case Category *</label>
              <select required className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CaseCategoryID} onChange={e => setFormData({ ...formData, CaseCategoryID: e.target.value })}>
                <option value="">Select Category...</option>
                {categories?.case_categories.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Gravity</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.GravityOffenceID} onChange={e => setFormData({ ...formData, GravityOffenceID: e.target.value })}>
                <option value="">Select Gravity...</option>
                {categories?.gravity_offences.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-data text-zinc-500 mb-1">Crime Sub-Head</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={formData.CrimeMinorHeadID} onChange={e => setFormData({ ...formData, CrimeMinorHeadID: e.target.value })}>
                <option value="">Select Sub-Head...</option>
                {categories?.crime_sub_heads.map((cs: any) => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 3: People Involved ── */}
        <div className="space-y-6">
          {/* Complainants */}
          <div className="cmd-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Complainants
              </h3>
              <button type="button" onClick={() => addPerson(setComplainants)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded transition">
                <Plus className="w-3 h-3" /> Add Complainant
              </button>
            </div>
            {complainants.map((c, i) => (
              <div key={i} className="flex gap-3 mb-3 items-center">
                <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}.</span>
                <input placeholder="Full Name" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none transition" value={c.name} onChange={e => handleArrayChange(setComplainants, i, "name", e.target.value)} />
                <input placeholder="Age" type="number" className="w-20 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none transition" value={c.age} onChange={e => handleArrayChange(setComplainants, i, "age", e.target.value)} />
                <button type="button" onClick={() => removePerson(setComplainants, i)} className="text-zinc-600 hover:text-red-500 p-1 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Victims */}
          <div className="cmd-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Victims
              </h3>
              <button type="button" onClick={() => addPerson(setVictims)} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded transition">
                <Plus className="w-3 h-3" /> Add Victim
              </button>
            </div>
            {victims.map((v, i) => (
              <div key={i} className="flex gap-3 mb-3 items-center">
                <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}.</span>
                <input placeholder="Full Name" className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none transition" value={v.name} onChange={e => handleArrayChange(setVictims, i, "name", e.target.value)} />
                <input placeholder="Age" type="number" className="w-20 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none transition" value={v.age} onChange={e => handleArrayChange(setVictims, i, "age", e.target.value)} />
                <button type="button" onClick={() => removePerson(setVictims, i)} className="text-zinc-600 hover:text-red-500 p-1 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Accused (with Fingerprint Upload) */}
          <div className="cmd-panel p-5 border border-red-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Accused Persons
              </h3>
              <button type="button" onClick={() => addPerson(setAccused, true)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition">
                <Plus className="w-3 h-3" /> Add Accused
              </button>
            </div>
            {accused.map((a, i) => (
              <div key={i} className="mb-4 p-3 bg-red-950/10 border border-red-900/20 rounded-lg">
                <div className="flex gap-3 items-center mb-2">
                  <span className="text-xs text-red-800 w-6 text-center font-bold">{i + 1}.</span>
                  <input placeholder="Full Name (type 'Unknown' for group)" className="flex-1 bg-zinc-900 border border-red-900/40 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={a.name} onChange={e => handleArrayChange(setAccused, i, "name", e.target.value)} />
                  {a.name.toLowerCase() !== "unknown" && (
                    <input placeholder="Age" type="number" className="w-20 bg-zinc-900 border border-red-900/40 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={a.age} onChange={e => handleArrayChange(setAccused, i, "age", e.target.value)} />
                  )}
                  <button type="button" onClick={() => removePerson(setAccused, i)} className="text-zinc-600 hover:text-red-500 p-1 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                {a.name.toLowerCase() === "unknown" && (
                  <div className="ml-9 flex items-center gap-3 mb-2">
                    <input placeholder="Number of people (e.g. 3)" type="number" className="w-48 bg-zinc-900 border border-red-900/40 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={a.unknownCount || ""} onChange={e => handleArrayChange(setAccused, i, "unknownCount", e.target.value)} />
                    <input placeholder="Age Range (e.g. 20-30)" className="w-48 bg-zinc-900 border border-red-900/40 rounded px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none transition" value={a.ageRange || ""} onChange={e => handleArrayChange(setAccused, i, "ageRange", e.target.value)} />
                  </div>
                )}
                {/* Fingerprint Upload */}
                <div className="ml-9 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,.bmp"
                    className="hidden"
                    ref={el => { fpInputRefs.current[i] = el; }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      handleArrayChange(setAccused, i, "fingerprintFile", file);
                    }}
                  />
                  {a.fingerprintFile ? (
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-400">{a.fingerprintFile.name}</span>
                      <button type="button" onClick={() => handleArrayChange(setAccused, i, "fingerprintFile", null)} className="text-zinc-500 hover:text-red-400 transition"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fpInputRefs.current[i]?.click()}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded transition"
                    >
                      <Fingerprint className="w-3.5 h-3.5" /> Upload Fingerprint (optional)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Evidence Upload ── */}
        <div className="cmd-panel p-6 border border-emerald-900/30">
          <h2 className="text-lg font-semibold border-b border-emerald-900/30 pb-2 mb-4 text-emerald-400 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Case Evidence (Optional)
          </h2>
          <p className="text-xs text-zinc-500 mb-4">Upload images, PDFs, audio or video files as case evidence.</p>

          <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-zinc-900/50 border-2 border-zinc-700 border-dashed rounded-md cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/20">
            <Upload className="w-8 h-8 text-zinc-600 mb-2" />
            <span className="text-sm text-zinc-500">Click to browse or drag files here</span>
            <span className="text-xs text-zinc-600 mt-1">Images, PDFs, Audio, Video — max 50MB each</span>
            <input type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,.pdf,audio/*,video/*" />
          </label>

          {evidenceFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              {evidenceFiles.map((ev, i) => (
                <div key={i} className="flex items-center gap-4 bg-zinc-900 p-3 rounded border border-zinc-800">
                  <File className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-shrink-0" style={{ maxWidth: '180px' }}>
                    <div className="text-sm text-white truncate">{ev.file.name}</div>
                    <div className="text-xs text-zinc-500">{(ev.file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <input
                    placeholder="Add brief description..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500/50 outline-none transition"
                    value={ev.description}
                    onChange={(e) => setEvidenceFiles(prev => {
                      const copy = [...prev];
                      copy[i] = { ...copy[i], description: e.target.value };
                      return copy;
                    })}
                  />
                  <button type="button" onClick={() => setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-red-500 text-zinc-500 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/crimes")}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Registering...
              </>
            ) : (
              "Register FIR"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
