"use client";
import { useState } from "react";
import { deleteEvidence, getEvidenceFileUrl } from "@/lib/api";
import { File, FileText, Image as ImageIcon, Video, Music, Trash2 } from "lucide-react";
import UploadEvidenceButton from "./UploadEvidenceButton";
import toast from "react-hot-toast";

interface EvidenceFile {
  EvidenceID: number;
  FileName: string;
  FileType: string;
  MimeType: string;
  Description?: string;
  UploadedAt: string;
}

export default function EvidenceSection({
  caseId,
  initialEvidence,
}: {
  caseId: string | number;
  initialEvidence: EvidenceFile[];
}) {
  const [evidence, setEvidence] = useState<EvidenceFile[]>(initialEvidence);

  const handleDelete = async (evidenceId: number, fileName: string) => {
    if (!confirm(`Delete evidence "${fileName}"? This cannot be undone.`)) return;

    try {
      await deleteEvidence(evidenceId);
      setEvidence((prev) => prev.filter((e) => e.EvidenceID !== evidenceId));
      toast.success("Evidence deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const getIcon = (fileType: string) => {
    switch (fileType) {
      case "image": return <ImageIcon className="w-8 h-8 text-zinc-500" />;
      case "pdf": return <FileText className="w-8 h-8 text-zinc-500" />;
      case "video": return <Video className="w-8 h-8 text-zinc-500" />;
      case "audio": return <Music className="w-8 h-8 text-zinc-500" />;
      default: return <File className="w-8 h-8 text-zinc-500" />;
    }
  };

  return (
    <div className="cmd-panel overflow-hidden border border-emerald-900/30">
      <div className="p-4 border-b border-emerald-900/30 flex items-center justify-between font-semibold text-emerald-400 bg-emerald-950/10">
        <div className="flex items-center">
          <File className="w-5 h-5 mr-2" />
          Case Evidence ({evidence.length})
        </div>
      </div>
      <div className="p-4">
        {evidence.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {evidence.map((ev) => (
              <div
                key={ev.EvidenceID}
                className="group flex flex-col bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-lg overflow-hidden transition-all relative"
              >
                <a
                  href={getEvidenceFileUrl(ev.EvidenceID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <div className="h-24 bg-zinc-900 flex items-center justify-center border-b border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                    {getIcon(ev.FileType)}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-medium text-white truncate" title={ev.FileName}>
                      {ev.FileName}
                    </div>
                    {ev.Description && (
                      <div className="text-xs text-zinc-500 line-clamp-2 mt-1">{ev.Description}</div>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-2">
                      {new Date(ev.UploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </a>
                <button
                  onClick={() => handleDelete(ev.EvidenceID, ev.FileName)}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-900/90 border border-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/50 hover:border-red-500/50 text-zinc-400 hover:text-red-400"
                  title="Delete evidence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-500 italic mb-4">No evidence submitted.</div>
        )}
        <UploadEvidenceButton caseId={caseId} />
      </div>
    </div>
  );
}
