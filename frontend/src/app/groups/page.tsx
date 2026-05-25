'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export interface ClassGroup {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  section: string;
}

const DEFAULT_GROUPS: ClassGroup[] = [
  { id: '1', name: 'Class 10-A', subject: 'Mathematics', studentCount: 42, section: 'A' },
  { id: '2', name: 'Class 10-B', subject: 'Science', studentCount: 38, section: 'B' },
  { id: '3', name: 'Class 9-A', subject: 'English', studentCount: 40, section: 'A' },
];

const STORAGE_KEY = 'vedaai-groups';

function loadGroups(): ClassGroup[] {
  if (typeof window === 'undefined') return DEFAULT_GROUPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ClassGroup[];
  } catch {
    /* ignore */
  }
  return DEFAULT_GROUPS;
}

function saveGroups(groups: ClassGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', section: '', studentCount: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setGroups(loadGroups());
  }, []);

  function persist(next: ClassGroup[]) {
    setGroups(next);
    saveGroups(next);
  }

  function resetForm() {
    setForm({ name: '', subject: '', section: '', studentCount: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  function handleSave() {
    if (!form.name.trim() || !form.subject.trim()) {
      setError('Group name and subject are required.');
      return;
    }
    const count = parseInt(form.studentCount, 10);
    if (form.studentCount && (isNaN(count) || count < 0)) {
      setError('Student count must be a non-negative number.');
      return;
    }

    const entry: ClassGroup = {
      id: editingId || crypto.randomUUID(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      section: form.section.trim() || '—',
      studentCount: count || 0,
    };

    if (editingId) {
      persist(groups.map((g) => (g.id === editingId ? entry : g)));
    } else {
      persist([...groups, entry]);
    }
    resetForm();
  }

  function handleEdit(g: ClassGroup) {
    setEditingId(g.id);
    setForm({
      name: g.name,
      subject: g.subject,
      section: g.section,
      studentCount: String(g.studentCount),
    });
    setShowForm(true);
    setMenuId(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this group?')) return;
    persist(groups.filter((g) => g.id !== id));
    setMenuId(null);
  }

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="My Groups"
        description="Organize students into classes and sections for assignments."
        action={
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium hover:opacity-90"
            style={{ background: 'var(--brand-dark)' }}
          >
            <Plus size={16} />
            Add Group
          </button>
        }
      />

      <div className="flex-1 p-6">
        <div className="relative mb-5 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 max-w-lg fade-in">
            <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              {editingId ? 'Edit Group' : 'New Group'}
            </h3>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                placeholder="Group name (e.g. Class 10-A)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                placeholder="Section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                type="number"
                min={0}
                placeholder="Students"
                value={form.studentCount}
                onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: 'var(--brand-orange)' }}
              >
                {editingId ? 'Save' : 'Create'}
              </button>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              No groups found
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
              Create class groups to assign assessments and track students by section.
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium"
              style={{ background: 'var(--brand-dark)' }}
            >
              <Plus size={16} />
              Add Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    {g.section !== '—' ? g.section : g.name.charAt(0)}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === g.id ? null : g.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {menuId === g.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[130px] py-1">
                        <button
                          onClick={() => handleEdit(g)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {g.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{g.subject}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span>{g.studentCount} students</span>
                  <Link
                    href="/assignments/create"
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--brand-orange)' }}
                  >
                    Create assignment →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
