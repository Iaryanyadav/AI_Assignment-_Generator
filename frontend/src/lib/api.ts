/**
 * API base URL:
 * - Empty string → same-origin `/api/...` (proxied to backend via next.config rewrites on Vercel)
 * - Set NEXT_PUBLIC_API_URL → call backend directly (requires CORS on the API server)
 */
function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return '';
}

const API_URL = getApiBaseUrl();

function apiUrl(path: string): string {
  const base = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${path}`;
}

function formatFetchError(err: unknown, path: string): string {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    if (!API_URL && typeof window !== 'undefined') {
      return (
        'Cannot reach the API. Deploy the backend and set API_URL in Vercel (Project Settings → Environment Variables), ' +
        'or set NEXT_PUBLIC_API_URL to your backend URL (e.g. https://your-api.railway.app), then redeploy.'
      );
    }
    if (API_URL.includes('localhost')) {
      return (
        'Cannot reach the API at localhost. On Vercel, set NEXT_PUBLIC_API_URL (or API_URL for rewrites) to your deployed backend URL and redeploy.'
      );
    }
    return `Cannot reach the API at ${API_URL}${path}. Check that the backend is running and CORS allows this site.`;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
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
    throw new Error(res.ok ? 'Invalid response from server' : `Request failed: ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
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
