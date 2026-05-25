'use client';
import { useEffect, useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { AppSettings, loadAppSettings, saveAppSettings } from '@/lib/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings());
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setSettings(loadAppSettings());
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!settings.teacherName.trim()) errs.teacherName = 'Name is required';
    if (!settings.schoolName.trim()) errs.schoolName = 'School name is required';
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      errs.email = 'Enter a valid email';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    saveAppSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Settings"
        description="Manage your profile, school details, and assignment preferences."
        action={
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium hover:opacity-90"
            style={{ background: 'var(--brand-dark)' }}
          >
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saved ? 'Saved' : 'Save changes'}
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-2xl">
        <section className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Teacher name</label>
              <input
                value={settings.teacherName}
                onChange={(e) => update('teacherName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {errors.teacherName && <p className="text-xs text-red-600 mt-1">{errors.teacherName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            School
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">School name</label>
              <input
                value={settings.schoolName}
                onChange={(e) => update('schoolName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {errors.schoolName && <p className="text-xs text-red-600 mt-1">{errors.schoolName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label>
              <input
                value={settings.schoolLocation}
                onChange={(e) => update('schoolLocation', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Assignment defaults
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Default subject</label>
              <input
                value={settings.defaultSubject}
                onChange={(e) => update('defaultSubject', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Default class</label>
              <input
                value={settings.defaultClass}
                onChange={(e) => update('defaultClass', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Notifications & export
          </h2>
          <div className="space-y-3">
            {(
              [
                ['notifyOnComplete', 'Notify when AI generation completes'],
                ['notifyOnFail', 'Notify when generation fails'],
                ['autoDownloadPdf', 'Prompt to download PDF after generation'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-orange-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <p className="text-xs text-gray-400 mt-4">
          API keys and database connections are configured in the backend <code className="text-gray-500">.env</code> file.
        </p>
      </div>
    </div>
  );
}
