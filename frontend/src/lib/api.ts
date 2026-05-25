const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
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
