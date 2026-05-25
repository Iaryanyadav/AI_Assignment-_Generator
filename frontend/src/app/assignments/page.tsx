'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { useAssignmentStore, Assignment } from '@/store/assignmentStore';
import { api } from '@/lib/api';
import { format } from 'date-fns';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24">
      <div className="relative mb-6">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
          <ClipboardList size={48} className="text-gray-300" />
        </div>
        <div className="absolute -top-1 -right-1 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-500 text-lg font-bold">×</span>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
        No assignments yet
      </h2>
      <p className="text-gray-400 text-sm text-center max-w-sm mb-8 leading-relaxed">
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/create"
        className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity"
        style={{ background: 'var(--brand-dark)' }}
      >
        <Plus size={16} />
        Create Your First Assignment
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const styles = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {status === 'processing' ? '● ' : ''}{status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            {assignment.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={assignment.status} />
            <span className="text-xs text-gray-400">{assignment.subject}</span>
            <span className="text-xs text-gray-400">· Class {assignment.className}</span>
          </div>
        </div>
        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[140px] py-1">
              <button
                onClick={() => { router.push(`/assignments/${assignment._id}`); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye size={14} />
                View Assignment
              </button>
              <button
                onClick={() => { onDelete(assignment._id); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <span>
          <span className="font-medium text-gray-500">Assigned on:</span>{' '}
          {format(new Date(assignment.createdAt), 'dd-MM-yyyy')}
        </span>
        <span>
          <span className="font-medium text-gray-500">Due:</span>{' '}
          {format(new Date(assignment.dueDate), 'dd-MM-yyyy')}
        </span>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { assignments, setAssignments, isLoadingList, setIsLoadingList, removeAssignment } = useAssignmentStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoadingList(true);
      try {
        const res = await api.assignments.list();
        setAssignments(res.data as Assignment[]);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setIsLoadingList(false);
      }
    };
    load();
  }, [setAssignments, setIsLoadingList]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.assignments.delete(id);
      removeAssignment(id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Assignments
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage and create assignments for your classes.</p>
          </div>
        </div>
      </div>

      {isLoadingList ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: 'var(--brand-orange)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-gray-400">Loading assignments...</p>
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 p-6">
          {/* Search & filter bar */}
          <div className="flex items-center gap-3 mb-5">
            <button className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 bg-white rounded-lg px-3 py-2 hover:bg-gray-50">
              <Filter size={14} />
              Filter By
            </button>
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((assignment) => (
              <AssignmentCard key={assignment._id} assignment={assignment} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Floating create button when assignments exist */}
      {assignments.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Link
            href="/assignments/create"
            className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg hover:opacity-90 transition-all hover:shadow-xl"
            style={{ background: 'var(--brand-dark)' }}
          >
            <Plus size={16} />
            Create Assignment
          </Link>
        </div>
      )}
    </div>
  );
}
