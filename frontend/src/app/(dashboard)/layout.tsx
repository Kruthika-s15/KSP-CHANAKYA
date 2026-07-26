"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import AuthGuard from "@/components/AuthGuard";
import ParticlesComponent from "@/components/ui/particles-bg";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* Full-screen particle canvas sits beneath everything */}
      <div className="relative min-h-screen w-full bg-zinc-950/60">
        <ParticlesComponent />
        {/* Layout shell floats above canvas */}
        <div className="absolute inset-0 flex h-full w-full print:block print:h-auto">
          <div className="print:hidden relative z-10 h-full">
            <Sidebar />
          </div>
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:block print:h-auto print:overflow-visible relative z-10">
            <div className="print:hidden">
              <TickerBar />
              <Header />
            </div>
            <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-transparent text-white print:block print:h-auto print:overflow-visible print:bg-white print:text-black print:p-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
