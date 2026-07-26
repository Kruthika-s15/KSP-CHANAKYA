'use client';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchCatalystNotifications } from '@/lib/api';

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);
  const [user, setUser] = useState<{ name: string; kgid: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();

  const getNotifications = async () => {
    try {
      const data = await fetchCatalystNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);

    // Read user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }

    // Load initial notifications
    getNotifications();

    // Close dropdowns if clicked outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(t);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    router.push('/login');
  };

  const handleToggleBell = () => {
    if (!bellOpen) {
      getNotifications();
    }
    setBellOpen(!bellOpen);
  };

  return (
    /* Increased header z-index to z-[100] relative */
    <header className="relative h-16 bg-[#0a0e14]/60 backdrop-blur-xl border-b border-[var(--line)] flex items-center justify-between px-6 shrink-0 z-[100]">
      <div className="flex items-center gap-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Global search — case ID, name, biometric ref..."
            className="w-full bg-black/40 border border-[var(--line)] text-zinc-100 rounded-md py-1.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500/60 text-sm placeholder:text-zinc-600"
          />
        </div>
        <div className="hidden lg:flex items-center gap-2 font-data text-[10px] text-zinc-500 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          SYS STATUS: NOMINAL
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <div className="hidden md:block font-data text-xs text-zinc-500 tabular-nums">
          {now ? now.toISOString().replace('T', ' ').slice(0, 19) + 'Z' : '—'}
        </div>
        <div className="w-px h-5 bg-[var(--line)] hidden md:block" />

        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider hover:bg-zinc-800 transition-colors"
        >
          <span className={language === 'en' ? 'text-white' : 'text-zinc-500'}>EN</span>
          <span className="text-zinc-600">|</span>
          <span className={language === 'kn' ? 'text-white' : 'text-zinc-500'}>ಕನ್ನಡ</span>
        </button>

        <div className="relative z-[101]" ref={bellRef}>
          <button
            onClick={handleToggleBell}
            className="text-zinc-400 hover:text-red-400 relative transition-colors p-2 rounded-md hover:bg-white/5"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#121820] border border-[var(--line)] rounded-lg shadow-2xl overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-[var(--line)] flex justify-between items-center bg-[#0d131a]">
                <p className="text-xs font-semibold text-white uppercase tracking-wider font-data">System Notifications</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 font-mono">
                  {notifications.length} NEW
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#1e293b] custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-white leading-snug">{notif.subject}</span>
                        <span className="text-[9px] text-zinc-500 font-mono shrink-0 ml-2">
                          {notif.sent_at ? new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{notif.body}</p>
                      <div className="mt-1.5 flex gap-2">
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {notif.channel}
                        </span>
                        {notif.delivered && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-emerald-950/40 text-emerald-400 font-mono">
                            Delivered
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-xs italic">
                    No recent notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Outer wrapper boosted to z-[101] */}
        <div className="relative z-[101]" ref={dropdownRef}>
          <div
            className="flex items-center space-x-2 text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors p-2 rounded-md hover:bg-white/5"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <UserCircle className="w-6 h-6 text-red-500/80" />
            <span className="font-medium">{user ? user.name : 'Officer Admin'}</span>
          </div>

          {dropdownOpen && (
            /* Dropdown box boosted to z-[1000] with solid dark background */
            <div className="absolute right-0 mt-2 w-56 bg-[#0a0e14] border border-[var(--line)] rounded-lg shadow-2xl overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-[var(--line)]">
                <p className="text-sm font-medium text-white">{user ? user.name : 'Officer Admin'}</p>
                <p className="text-xs text-zinc-500 font-data tracking-wider mt-0.5">KGID: {user ? user.kgid : 'UNKNOWN'}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}