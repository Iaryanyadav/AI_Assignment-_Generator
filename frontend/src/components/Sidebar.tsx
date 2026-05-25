'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  ClipboardList,
  Wand2,
  BookOpen,
  Settings,
  Plus,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Wand2 },
  { href: '/library', label: 'My Library', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--brand-orange)' }}
          >
            V
          </div>
          <span className="font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
            VedaAI
          </span>
        </Link>
      </div>

      {/* Create Button */}
      <div className="px-4 mb-5">
        <Link
          href="/assignments/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand-dark)' }}
        >
          <Plus size={16} />
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 mb-3"
        >
          <Settings size={17} strokeWidth={1.5} />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E8521A, #FF8C42)' }}
          >
            DPS
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Delhi Public School</p>
            <p className="text-xs text-gray-400 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
