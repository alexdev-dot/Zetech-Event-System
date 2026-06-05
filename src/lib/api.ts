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

let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE_URL}/csrf-token`)
      .then(handleResponse)
      .then((data) => data.token)
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

async function csrfHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  return {
    ...authHeaders(),
    ...extraHeaders,
    "X-CSRF-Token": await getCsrfToken(),
  };
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

    create: async (data: any) =>
      fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),

    update: async (id: string, data: any) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),

    delete: async (id: string) =>
      fetch(`${API_BASE_URL}/events/${id}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    register: async (eventId: string, _studentId?: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({}),
      }).then(handleResponse),

    cancelRegistration: async (eventId: string, studentId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/register/${studentId}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    trackInteraction: async (data: {
      user_id: string | number;
      event_id: string | number;
      interaction_type: "view" | "click" | "register";
      time_spent?: number;
    }) =>
      fetch(`${API_BASE_URL}/events/interaction`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),

    getRecommendations: (userId: string | number) =>
      fetch(`${API_BASE_URL}/events/recommendations/${userId}`, {
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

    approveEvent: async (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/events/${id}/approve`, {
        method: "PATCH",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    rejectEvent: async (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/events/${id}/reject`, {
        method: "PATCH",
        headers: await csrfHeaders(),
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

    updateStudentStatus: async (studentId: string | number, status: "active" | "deleted") =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}/status`, {
        method: "PATCH",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status }),
      }).then(handleResponse),

    deleteStudent: async (studentId: string) =>
      fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    updateAccount: async (data: {
      currentPassword: string;
      newEmail?: string;
      newPassword?: string;
      confirmNewPassword?: string;
    }) =>
      fetch(`${API_BASE_URL}/admin/account`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
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

    createClubLeader: async (data: {
      email: string;
      password: string;
      name: string;
      club: string;
    }) =>
      fetch(`${API_BASE_URL}/admin/club-leaders`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),

    deleteClubLeader: async (id: string | number) =>
      fetch(`${API_BASE_URL}/admin/club-leaders/${id}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    // System settings
    getSettings: () =>
      fetch(`${API_BASE_URL}/admin/settings`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateSettings: async (settings: Record<string, string>) =>
      fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(settings),
      }).then(handleResponse),

    // Category management
    getCategories: () =>
      fetch(`${API_BASE_URL}/admin/categories`, {
        headers: authHeaders(),
      }).then(handleResponse),

    createCategory: async (name: string) =>
      fetch(`${API_BASE_URL}/admin/categories`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    updateCategory: async (id: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    deleteCategory: async (id: number) =>
      fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    addSubcategory: async (categoryId: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/categories/${categoryId}/subcategories`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    updateSubcategory: async (id: number, name: string) =>
      fetch(`${API_BASE_URL}/admin/subcategories/${id}`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    deleteSubcategory: async (id: number) =>
      fetch(`${API_BASE_URL}/admin/subcategories/${id}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),

    // SMS
    sendSMS: async (data: { message: string; targetGroup?: string; recipients?: string[] }) =>
      fetch(`${API_BASE_URL}/admin/sms/send`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),

    sendEventSMS: async (eventId: string | number, message: string) =>
      fetch(`${API_BASE_URL}/admin/sms/event/${eventId}`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ message }),
      }).then(handleResponse),

    getStudentSignups: () =>
      fetch(`${API_BASE_URL}/admin/students/signups`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateProfile: async (data: { name: string }) =>
      fetch(`${API_BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
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

    getAuditLogs: (params?: { page?: number; limit?: number; filter?: string; failed?: boolean }) => {
      const qp = new URLSearchParams();
      if (params?.page) qp.set("page", String(params.page));
      if (params?.limit) qp.set("limit", String(params.limit));
      if (params?.filter) qp.set("filter", params.filter);
      if (params?.failed) qp.set("failed", "true");
      const qs = qp.toString();
      return fetch(`${API_BASE_URL}/admin/audit-logs${qs ? `?${qs}` : ""}`, {
        headers: authHeaders(),
      }).then(handleResponse);
    },
  },

  // **CLUB LEADERS** //
  clubLeader: {
    getDashboard: () =>
      fetch(`${API_BASE_URL}/club-leader/dashboard`, {
        headers: authHeaders(),
      }).then(handleResponse),

    getEventRegistrations: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/club-leader/events/${eventId}/registrations`, {
        headers: authHeaders(),
      }).then(handleResponse),

    updateAccount: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) =>
      fetch(`${API_BASE_URL}/club-leader/account`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  upload: {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: await csrfHeaders(),
        body: formData,
      }).then(handleResponse);
    },
  },

  health: () => fetch(`${API_BASE_URL}/health`).then(handleResponse),

  reactions: {
    get: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/reactions`, {
        headers: authHeaders(),
      }).then(handleResponse),
    react: async (eventId: string | number, type: "fire" | "heart" | "wow") =>
      fetch(`${API_BASE_URL}/events/${eventId}/react`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ type }),
      }).then(handleResponse),
  },

  comments: {
    get: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/comments`).then(handleResponse),
    post: async (eventId: string | number, content: string) =>
      fetch(`${API_BASE_URL}/events/${eventId}/comments`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ content }),
      }).then(handleResponse),
    delete: async (eventId: string | number, commentId: number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/comments/${commentId}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),
  },

  attendees: {
    get: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/attendees`).then(handleResponse),
  },

  waitlist: {
    getStatus: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/waitlist/status`, {
        headers: authHeaders(),
      }).then(handleResponse),
    join: async (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/waitlist`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({}),
      }).then(handleResponse),
    leave: async (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/waitlist`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      }).then(handleResponse),
  },

  gallery: {
    get: (eventId: string | number) =>
      fetch(`${API_BASE_URL}/events/${eventId}/gallery`).then(handleResponse),
    upload: async (eventId: string | number, file: File, caption?: string) => {
      const formData = new FormData();
      formData.append("image", file);
      if (caption) formData.append("caption", caption);
      return fetch(`${API_BASE_URL}/events/${eventId}/gallery`, {
        method: "POST",
        headers: await csrfHeaders(),
        body: formData,
      }).then(handleResponse);
    },
  },

};
