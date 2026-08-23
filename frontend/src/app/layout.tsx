import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "react-hot-toast";
export const metadata: Metadata = {
  title: "KSP AI Crime Intelligence",
  description: "Digital City Twin and Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased text-zinc-100 h-screen flex overflow-hidden">
        <LanguageProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={{ className: 'bg-zinc-900 text-white border border-zinc-800' }} />
        </LanguageProvider>
      </body>
    </html>
  );
}
