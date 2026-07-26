'use client';
import Link from 'next/link';
import kspLogo from '@/public/ksp-logo.png';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Fingerprint,
  Users,
  Map,
  BarChart3,
  Bot,
  Layers,
  Share2,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    // 💡 Fix: Point Overview to '/' if your dashboard is at src/app/page.tsx
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    {
      name: 'Crime Intelligence',
      icon: ShieldAlert,
      children: [
        { name: 'All Crimes / Search', href: '/crimes' },
        { name: 'Crime Trends', href: '/analytics' },
        { name: 'Crime Hotspots (Map)', href: '/crime-hotspots' }, // Map 3 (Heatmap)
      ]
    },
    { name: 'Biometric Search', href: '/biometric', icon: Fingerprint },
    { name: 'Crime Network', href: '/crime-network', icon: Share2 },
    { name: 'Digital City Twin', href: '/city-twin', icon: Map }, // Map 2 (3D Map)
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Personnel', href: '/personnel', icon: Users },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    { name: 'Platform Services', href: '/catalyst', icon: Layers },
  ];

  return (
    <aside className="w-64 border-r border-white/10 flex flex-col h-full shrink-0 relative z-20 bg-transparent">
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-red-500/40 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-transparent">
        <div className="flex items-center gap-3">
          <img
            src="/ksp-logo.png"
            alt="KSP Emblem"
            className="h-9 w-9 object-contain rounded-md flex-shrink-0"
          />
          <h1 className="text-sm font-bold text-white tracking-[0.15em] leading-none">KSP - CHANAKYA</h1>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar bg-transparent">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div className="mb-2">
                  <div className="px-3 py-2 flex items-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-data">
                    <item.icon className="w-3.5 h-3.5 mr-2" />
                    {item.name}
                  </div>
                  <div className="pl-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 border-l-2 ${pathname === child.href
                          ? 'bg-red-500/20 text-red-400 font-medium border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white border-transparent'
                          }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center px-3 py-2 mb-1 rounded-md text-sm transition-all duration-200 border-l-2 ${pathname === item.href
                    ? 'bg-red-500/20 text-red-400 font-medium border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white border-transparent'
                    }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {t(item.name)}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-white/10 bg-transparent">
        <div className="flex items-center justify-between font-data text-[10px] text-zinc-400 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 cmd-status-dot animate-pulse" />
            SECURE LINK
          </span>
          <span>ENC/AES-256</span>
        </div>
      </div>
    </aside>
  );
}
