'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, FileText, ExternalLink } from 'lucide-react';
import { useAssignmentStore, Assignment } from '@/store/assignmentStore';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';

export default function LibraryPage() {
  const { assignments, setAssignments, isLoadingList, setIsLoadingList } = useAssignmentStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoadingList(true);
      try {
        const res = await api.assignments.list();
        setAssignments(res.data as Assignment[]);
      } catch (err) {
        console.error('Failed to load library:', err);
      } finally {
        setIsLoadingList(false);
      }
    };
    load();
  }, [setAssignments, setIsLoadingList]);

  const completed = assignments.filter((a) => a.status === 'completed');
  const filtered = completed.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="My Library"
        description="Browse completed question papers and reuse them for future assessments."
      />

      <div className="flex-1 p-6">
        <div className="relative mb-5 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--brand-orange)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={40} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Library is empty
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
              Completed assignments with generated papers appear here automatically.
            </p>
            <Link
              href="/assignments/create"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--brand-orange)' }}
            >
              Create an assignment →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <Link
                key={a._id}
                href={`/assignments/${a._id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {a.subject} · Class {a.className}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-400">
                  Generated {format(new Date(a.updatedAt || a.createdAt), 'dd MMM yyyy')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
