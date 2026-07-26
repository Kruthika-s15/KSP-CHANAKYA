'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, MicOff, FileText, Database, Code, MapPin, Calendar, AlertCircle, Paperclip, Loader2 } from 'lucide-react';
import { fetchChat } from '@/lib/api';
import Link from 'next/link';
import AiMessageBubble from '@/components/AiMessageBubble';
import { useLanguage } from '@/contexts/LanguageContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  references?: any[];
  mode_used?: string;
};

export default function AIAssistant() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: language === 'kn'
        ? 'ನಮಸ್ಕಾರ. ನಾನು KSP AI ಸಹಾಯಕ. ಅಪರಾಧ ವರ್ಗಗಳನ್ನು ಹುಡುಕಲು, FIR ಪ್ರಕರಣಗಳನ್ನು ಪ್ರಶ್ನಿಸಲು ಮತ್ತು ಡೇಟಾ ವಿಶ್ಲೇಷಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನಿಮ್ಮ ತನಿಖೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?'
        : 'Namaskara. I am the KSP AI Assistant. I can help you search through crime categories, query specific FIR cases, and analyze connected data in English or Kannada. How can I assist your investigation today?',
    }
  ]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode]           = useState<'natural' | 'sql'>('natural');
  const [isListening, setIsListening] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ocrInputRef    = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Web Speech API (microphone) ────────────────────────────────────────
  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.continuous     = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onend  = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  // ── OCR document upload ────────────────────────────────────────────────
  const handleOcrUpload = async (file: File) => {
    if (!file) return;
    setIsOcrLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      const form  = new FormData();
      form.append('document', file);
      const res = await fetch('http://127.0.0.1:8000/api/v1/biometrics/ocr', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OCR failed');
      const extracted = data.extracted_text || '(no text extracted)';
      setInput((prev) =>
        prev
          ? `${prev}\n\n[Document: ${file.name}]\n${extracted}`
          : `[Document: ${file.name}]\n${extracted}`
      );
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `OCR Error: ${err.message}` },
      ]);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build language-aware system hint
      const langHint = language === 'kn'
        ? 'IMPORTANT: The user has selected Kannada language. Please respond entirely in Kannada (ಕನ್ನಡ) script. '
        : '';

      const response = await fetchChat({
        message: langHint + userMessage.content,
        mode: mode,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        references: response.references,
        mode_used: response.mode_used
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error connecting to the intelligence database. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col cmd-panel overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="cmd-eyebrow leading-none mb-1">KSP // Cognitive Query Interface</p>
            <h1 className="font-bold text-white flex items-center">
              KSP AI Investigator
              <span className={`ml-3 px-2 py-0.5 text-[10px] uppercase font-bold rounded ${mode === 'sql' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {mode === 'sql' ? 'SQL Mode' : 'Natural AI'}
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Contextual query across FIRs, evidence, and databases</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setMode(mode === 'natural' ? 'sql' : 'natural')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center border ${mode === 'sql' ? 'bg-purple-600 text-white border-purple-500 hover:bg-purple-700' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
          >
            <Code className="w-3 h-3 mr-1.5" />
            {mode === 'sql' ? 'Switch to Natural' : 'Investigator SQL Mode'}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col custom-scrollbar bg-[#0a0e14]">
        {messages.map((msg, idx) => (
          <AiMessageBubble key={idx} message={msg} isLatest={idx === messages.length - 1} />
        ))}
        {isLoading && (
          <div className="flex items-start space-x-4 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-red-600 flex flex-shrink-0 items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-zinc-700 flex space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#0a0e14] border-t border-[var(--line)]">
        {/* Suggestion Chips */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
          {["Analyze Hotspots", "Search Suspect Record", "Generate Case Summary", "Show recent FIRs"].map((suggestion) => (
            <button 
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="p-4 pb-6 max-w-4xl mx-auto">
          <div className={`relative flex flex-col bg-[#121820] border rounded-2xl overflow-hidden shadow-xl transition-all ${mode === 'sql' ? 'border-purple-700/50 focus-within:ring-1 focus-within:ring-purple-500/50' : 'border-zinc-800 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-red-500/20'}`}>
            <textarea 
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-transparent text-zinc-100 p-4 max-h-48 min-h-[56px] resize-none focus:outline-none text-sm placeholder-zinc-600 font-sans leading-relaxed"
              placeholder={mode === 'sql' ? 'SELECT * FROM casemaster LIMIT 10;' : 'Message CHANAKYA...'}
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between p-3 pt-0">
              <div className="flex items-center space-x-1">
                {/* OCR document upload */}
                <input
                  ref={ocrInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="ocr-file-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOcrUpload(f); e.target.value = ''; }}
                />
                <button
                  onClick={() => ocrInputRef.current?.click()}
                  disabled={isOcrLoading}
                  className="p-1.5 text-zinc-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-zinc-800 relative"
                  title="Upload FIR / Document for OCR Analysis"
                >
                  {isOcrLoading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <button className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800" title="Quick Template">
                  <FileText className="w-4 h-4" />
                </button>
                {/* Microphone / Web Speech API */}
                <button
                  onClick={toggleMic}
                  className={`p-1.5 transition-colors rounded-lg hover:bg-zinc-800 ${
                    isListening
                      ? 'text-red-400 bg-red-500/10 animate-pulse'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                  title={isListening ? 'Stop Recording' : 'Voice Input (Web Speech API)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-2 text-white rounded-xl transition-all ${mode === 'sql' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'} disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none flex items-center justify-center`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-3 font-data tracking-wider uppercase">
            {mode === 'sql' ? 'Raw SQL Executor Mode' : 'AI responses may contain inaccuracies. Verify official records.'}
          </p>
        </div>
      </div>
    </div>
  );
}
