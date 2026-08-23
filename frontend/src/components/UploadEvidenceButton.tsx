"use client";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { uploadEvidence } from "@/lib/api";
import toast from "react-hot-toast";

export default function UploadEvidenceButton({ caseId }: { caseId: number | string }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setLoading(true);
      toast.loading("Uploading evidence...", { id: "upload-evidence" });
      try {
        await uploadEvidence(caseId, files);
        toast.success("Evidence uploaded successfully!", { id: "upload-evidence" });
        window.location.reload();
      } catch (err: any) {
        console.error("Evidence upload error:", err);
        toast.error(err.message || "Upload failed", { id: "upload-evidence" });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input 
        type="file" 
        multiple 
        accept="image/*,.pdf,audio/*,video/*"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-sm text-emerald-400 rounded transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        <span>{loading ? "Uploading..." : "Upload Evidence"}</span>
      </button>
    </>
  );
}
