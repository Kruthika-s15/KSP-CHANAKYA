'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      <Printer className="w-4 h-4" />
      <span>Print / Save PDF Report</span>
    </button>
  );
}
