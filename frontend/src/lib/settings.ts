export interface AppSettings {
  teacherName: string;
  email: string;
  schoolName: string;
  schoolLocation: string;
  defaultSubject: string;
  defaultClass: string;
  notifyOnComplete: boolean;
  notifyOnFail: boolean;
  autoDownloadPdf: boolean;
}

const STORAGE_KEY = 'vedaai-settings';

const DEFAULTS: AppSettings = {
  teacherName: 'John Doe',
  email: '',
  schoolName: 'Delhi Public School',
  schoolLocation: 'Bokaro Steel City',
  defaultSubject: 'Mathematics',
  defaultClass: '10',
  notifyOnComplete: true,
  notifyOnFail: true,
  autoDownloadPdf: false,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
