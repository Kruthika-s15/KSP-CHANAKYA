import { Bot, UserCircle, Database, MapPin, Calendar, AlertCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  references?: any[];
  mode_used?: string;
};

export default function AiMessageBubble({ message, isLatest }: { message: Message, isLatest?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex items-start space-x-4 max-w-4xl self-end flex-row-reverse space-x-reverse mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex flex-shrink-0 items-center justify-center border border-zinc-700 shadow-md">
          <UserCircle className="w-5 h-5 text-zinc-300" />
        </div>
        <div className="bg-[#1c1c1e] text-white p-4 rounded-2xl rounded-tr-sm border border-zinc-800 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start space-x-4 max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-500/50 flex flex-shrink-0 items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
        <Bot className="w-5 h-5 text-red-400" />
      </div>
      
      <div className="bg-black/40 backdrop-blur-sm text-zinc-200 p-5 rounded-2xl rounded-tl-sm border border-[var(--line)] shadow-lg relative group w-full">
        {/* Header: Model Indicator & Actions */}
        <div className="flex items-center justify-between mb-3 border-b border-[var(--line)] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">CHANAKYA-1</span>
            {message.mode_used && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                {message.mode_used === 'sql' ? 'SQL EXECUTOR' : 'COGNITIVE ENGINE'}
              </span>
            )}
          </div>
          <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Evidence References */}
        {message.references && message.references.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <p className="text-xs text-zinc-400 font-semibold mb-3 flex items-center">
              <Database className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> 
              Retrieved Evidence ({message.references.length} records)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.references.slice(0, 5).map((ref, i) => (
                <Link 
                  href={`/crimes/${ref.CaseMasterID || ''}`} 
                  key={i}
                  className="bg-black/60 border border-zinc-800 p-3 rounded-lg hover:border-red-500/50 hover:bg-red-500/5 transition-all group block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-red-400 transition-colors">
                      {ref.CrimeNo || ref.CaseNo || 'Unknown FIR'}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {ref.CaseStatus || 'Unknown Status'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-zinc-500">
                    <div className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1.5 opacity-70" />
                      <span className="truncate">{ref.CrimeSubHead || ref.CrimeHead || 'Unspecified Crime'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1.5 opacity-70" />
                      <span className="truncate">
                        {[ref.PoliceStationName, ref.DistrictName].filter(Boolean).join(', ') || 'Location Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
                      <span>
                        {ref.CrimeRegisteredDate ? new Date(ref.CrimeRegisteredDate).toLocaleDateString() : 'Date Unknown'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {message.references.length > 5 && (
              <div className="mt-3 text-center">
                <Link 
                  href="/crimes" 
                  className="text-xs text-red-400 hover:text-red-300 font-medium hover:underline transition-colors"
                >
                  View All {message.references.length} Results
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
