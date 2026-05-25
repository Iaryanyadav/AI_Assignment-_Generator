/**
 * Browser requests use same-origin `/api/*`, proxied by `src/app/api/[...path]/route.ts`.
 * Set API_URL on Vercel to your deployed backend (e.g. Railway). Do not point at the Vercel frontend URL.
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  const serverUrl =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://localhost:4000';
  return serverUrl.replace(/\/$/, '');
}

const API_BASE = getApiBaseUrl();

function apiUrl(path: string): string {
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path}`;
}

function formatFetchError(err: unknown, path: string): string {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return (
      'Cannot reach the API. Set API_URL on Vercel to your backend URL (e.g. https://your-api.railway.app) and redeploy.'
    );
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

function formatHttpError(status: number, path: string, message?: string): string {
  if (status === 404) {
    return (
      message ||
      `API not found (${path}). On Vercel, set API_URL to your backend URL — not your Vercel app URL. ` +
        'Example: API_URL=https://your-project.up.railway.app'
    );
  }
  if (status === 502) {
    return message || 'Backend unreachable. Check API_URL and that the backend is running.';
  }
  return message || `Request failed: ${status}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        ...(options?.headers || {}),
      },
    });
  } catch (err) {
    throw new Error(formatFetchError(err, path));
  }

  let data: { error?: string; success?: boolean };
  try {
    data = await res.json();
  } catch {
    throw new Error(formatHttpError(res.status, path, res.ok ? 'Invalid response from server' : undefined));
  }

  if (!res.ok) {
    throw new Error(formatHttpError(res.status, path, data.error));
  }

  return data as T;
}

export interface CreateAssignmentPayload {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: { type: string; count: number; marks: number }[];
  additionalInstructions?: string;
  file?: File;
}

export const api = {
  assignments: {
    list: () => request<{ success: boolean; data: unknown[] }>('/api/assignments'),

    get: (id: string) => request<{ success: boolean; data: unknown }>(`/api/assignments/${id}`),

    create: async (payload: CreateAssignmentPayload) => {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('subject', payload.subject);
      formData.append('className', payload.className);
      formData.append('dueDate', payload.dueDate);
      formData.append('questionTypes', JSON.stringify(payload.questionTypes));
      if (payload.additionalInstructions) {
        formData.append('additionalInstructions', payload.additionalInstructions);
      }
      if (payload.file) {
        formData.append('file', payload.file);
      }

      return request<{ success: boolean; data: { assignmentId: string; jobId: string } }>(
        '/api/assignments',
        {
          method: 'POST',
          body: formData,
        }
      );
    },

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/assignments/${id}`, { method: 'DELETE' }),

    regenerate: (id: string) =>
      request<{ success: boolean; data: { assignmentId: string; jobId: string } }>(
        `/api/assignments/${id}/regenerate`,
        { method: 'POST' }
      ),
  },
};
