const API_BASE_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("authToken");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
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
  categories: {
    getAll: () =>
      fetch(`${API_BASE_URL}/categories`).then(handleResponse),
  },

  auth: {
    register: (data: {
      firstName: string;
      lastName: string;
      email: string;
      admissionNumber: string;
      password: string;
    }) =>
      fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (admissionNumber: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNumber, password }),
      }).then(handleResponse),

    adminLogin: (email: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }).then(handleResponse),

    getRecent: (limit = 12) =>
      fetch(`${API_BASE_URL}/events/recent?limit=${limit}`, {
        headers: { "Content-Type": "application/json" },
      }).then(handleResponse),

    getById: (id: string) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        headers: { "Content-Type": "application/json" },
      }).then(handleResponse),

    create: (data: any) =>
      fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    update: (id: string, data: any) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    delete: (id: string) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    register: (eventId: string, _studentId?: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(handleResponse),

    cancelRegistration: (eventId: string, studentId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register/${studentId}`, {
        method: "DELETE",
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
        method: "PATCH",
        headers: authHeaders(),
      }).then(handleResponse),

    rejectEvent: (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/events/${id}/reject`, {
        method: "PATCH",
        headers: authHeaders(),
      }).then(handleResponse),

    getEventRegistrations: (eventId: string) =>
      fetch(`${API_BASE_URL}/admin/events/${eventId}/registrations`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getStudents: (params?: { page?: number; limit?: number; search?: string }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set("page", String(params.page));
      if (params?.limit) qp.set("limit", String(params.limit));
      if (params?.search) qp.set("search", params.search);
      const qs = qp.toString();
      return fetch(`${API_BASE_URL}/admin/students${qs ? `?${qs}` : ""}`, {
        headers: authHeaders(),
      }).then(handleResponse);
    },

    updateStudentStatus: (studentId: string | number, status: "active" | "deleted") =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(handleResponse),

    deleteStudent: (studentId: string) =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    updateAccount: (data: {
      currentPassword: string;
      newEmail?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    }) =>
      fetch(`${API_BASE_URL}/admin/account`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    getAnalytics: () =>
      fetch(`${API_BASE_URL}/admin/analytics`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getStudentActivity: (studentId: string | number) =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}/activity`, {
        headers: authHeaders(),
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

    createClubLeader: (data: {
      email: string;
      password: string;
      name: string;
      club: string;
    }) =>
      fetch(`${API_BASE_URL}/admin/club-leaders`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    deleteClubLeader: (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/club-leaders/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    // System settings
    getSettings: () =>
      fetch(`${API_BASE_URL}/admin/settings`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateSettings: (settings: Record<string, string>) =>
      fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).then(handleResponse),

    // Category management
    getCategories: () =>
      fetch(`${API_BASE_URL}/admin/categories`, {
        headers: authHeaders(),
      }).then(handleResponse),

    createCategory: (name: string) =>
      fetch(`${API_BASE_URL}/admin/categories`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    updateCategory: (id: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    deleteCategory: (id: number) =>
      fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    addSubcategory: (categoryId: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/categories/${categoryId}/subcategories`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    updateSubcategory: (id: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/subcategories/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    deleteSubcategory: (id: number) =>
      fetch(`${API_BASE_URL}/admin/subcategories/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }).then(handleResponse),

    // SMS
    sendSMS: (data: { message: string; targetGroup?: string; recipients?: string[] }) =>
      fetch(`${API_BASE_URL}/admin/sms/send`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    sendEventSMS: (eventId: string | number, message: string) =>
      fetch(`${API_BASE_URL}/admin/sms/event/${eventId}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }).then(handleResponse),

    getStudentSignups: () =>
      fetch(`${API_BASE_URL}/admin/students/signups`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateProfile: (data: { name: string }) =>
      fetch(`${API_BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),

    exportStudents: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/export/students`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    exportEvents: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/export/events`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `events_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
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

    updateAccount: (data: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) =>
      fetch(`${API_BASE_URL}/club-leader/account`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      }).then(handleResponse);
    },
  },

  health: () => fetch(`${API_BASE_URL}/health`).then(handleResponse),
};
