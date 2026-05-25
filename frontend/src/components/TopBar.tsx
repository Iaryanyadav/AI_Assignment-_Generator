'use client';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getPageTitle } from '@/lib/pageTitles';

export default function TopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
        <span className="text-sm text-gray-500 font-medium">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--brand-orange)' }}
          />
        </button>

        <button className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg py-1.5 px-2 transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            JD
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">John Doe</span>
          <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
