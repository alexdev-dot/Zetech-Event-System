const API_BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('authToken');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  auth: {
    register: (data: {
      firstName: string;
      lastName: string;
      email: string;
      admissionNumber: string;
      password: string;
    }) =>
      fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (admissionNumber: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionNumber, password }),
      }).then(handleResponse),

    adminLogin: (email: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(handleResponse),

    me: () =>
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },

  events: {
    getAll: () =>
      fetch(`${API_BASE_URL}/events`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(handleResponse),

    getRecent: (limit = 12) =>
      fetch(`${API_BASE_URL}/events/recent?limit=${limit}`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(handleResponse),

    getById: (id: string) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      }).then(handleResponse),

    create: (data: any) =>
      fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    update: (id: string, data: any) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    delete: (id: string) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(handleResponse),

    register: (eventId: string, _studentId?: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      }).then(handleResponse),

    cancelRegistration: (eventId: string, studentId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register/${studentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(handleResponse),
  },

  students: {
    getRegistrations: (studentId: string) =>
      fetch(`${API_BASE_URL}/students/${studentId}/registrations`, {
        headers: authHeaders(),
      }).then(handleResponse),
  },

  admin: {
    getDashboardStats: () =>
      fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getAllEvents: () =>
      fetch(`${API_BASE_URL}/admin/events`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getPendingEvents: () =>
      fetch(`${API_BASE_URL}/admin/events/pending`, {
        headers: authHeaders(),
      }).then(handleResponse),

    approveEvent: (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/events/${id}/approve`, {
        method: 'PATCH',
        headers: authHeaders(),
      }).then(handleResponse),

    rejectEvent: (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/events/${id}/reject`, {
        method: 'PATCH',
        headers: authHeaders(),
      }).then(handleResponse),

    getEventRegistrations: (eventId: string) =>
      fetch(`${API_BASE_URL}/admin/events/${eventId}/registrations`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getStudents: () =>
      fetch(`${API_BASE_URL}/admin/students`, {
        headers: authHeaders(),
      }).then(handleResponse),

    deleteStudent: (studentId: string) =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(handleResponse),

    updateAccount: (data: {
      currentPassword: string;
      newEmail?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    }) =>
      fetch(`${API_BASE_URL}/admin/account`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    getActivity: () =>
      fetch(`${API_BASE_URL}/admin/activity`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getRecentRegistrations: (limit?: number) => {
      const url = limit
        ? `${API_BASE_URL}/admin/recent-registrations?limit=${limit}`
        : `${API_BASE_URL}/admin/recent-registrations`;
      return fetch(url, { headers: authHeaders() }).then(handleResponse);
    },

    getActiveSessions: (includeInactive = false) => {
      const url = includeInactive
        ? `${API_BASE_URL}/admin/active-sessions?includeInactive=true`
        : `${API_BASE_URL}/admin/active-sessions`;
      return fetch(url, { headers: authHeaders() }).then(handleResponse);
    },

    getClubLeaders: () =>
      fetch(`${API_BASE_URL}/admin/club-leaders`, {
        headers: authHeaders(),
      }).then(handleResponse),

    createClubLeader: (data: { email: string; password: string; name: string; club: string }) =>
      fetch(`${API_BASE_URL}/admin/club-leaders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),

    deleteClubLeader: (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/club-leaders/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(handleResponse),
  },

  clubLeader: {
    getDashboard: () =>
      fetch(`${API_BASE_URL}/club-leader/dashboard`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getEventRegistrations: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/club-leader/events/${eventId}/registrations`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateAccount: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
      fetch(`${API_BASE_URL}/club-leader/account`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  health: () => fetch(`${API_BASE_URL}/health`).then(handleResponse),
};
