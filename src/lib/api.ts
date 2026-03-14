/**
 * Central API client — all database/backend calls go through here.
 * Points to your Express API server (runs on Oracle Cloud alongside MySQL).
 *
 * Configure VITE_API_URL in .env to point to your API server.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/account/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signUp: (email: string, password: string, full_name: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  me: () => request<AuthUser>('/auth/me'),

  updatePassword: (password: string) =>
    request('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const profilesApi = {
  get: () => request<Profile>('/profiles/me'),
  update: (data: Partial<Profile>) =>
    request<Profile>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  service_name: string;
  status: string;
  price_bzd: number;
  billing_period: string;
  started_at: string;
  expires_at: string | null;
  service_id: string | null;
}

export const subscriptionsApi = {
  mine: () => request<Subscription[]>('/subscriptions/mine'),
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  total_bzd: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
}

export const ordersApi = {
  list: (statusFilter?: string) =>
    request<Order[]>(`/orders${statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
  updateStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  create: (data: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    payment_method: string;
    items: Array<{ name: string; price: number; quantity: number; service_id?: string }>;
  }) => request<{ order_id: string }>('/orders', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export const customersApi = {
  list: () => request<Customer[]>('/customers'),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  subject: string;
  message: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  source: string | null;
  created_at: string;
}

export const ticketsApi = {
  list: (statusFilter?: string) =>
    request<Ticket[]>(`/tickets${statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
  updateStatus: (id: string, status: string) =>
    request(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request('/tickets/contact', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Employees ───────────────────────────────────────────────────────────────

export interface Employee {
  user_id: string;
  role: 'admin' | 'support';
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export const employeesApi = {
  list: () => request<Employee[]>('/employees'),
  create: (data: { email: string; password: string; full_name: string; role: string }) =>
    request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (userId: string, role: string) =>
    request(`/employees/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  remove: (userId: string) =>
    request(`/employees/${userId}`, { method: 'DELETE' }),
};

// ─── App Settings ────────────────────────────────────────────────────────────

export const settingsApi = {
  list: () => request<Array<{ key: string; value: string | null }>>('/settings'),
  save: (settings: Record<string, string>) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  orders: number;
  revenue: number;
  customers: number;
  tickets: number;
  recentOrders: Array<{
    id: string;
    customer_name: string | null;
    total_bzd: number;
    status: string;
    created_at: string;
  }>;
}

export const dashboardApi = {
  stats: () => request<DashboardStats>('/dashboard/stats'),
};

// ─── 2FA / TOTP ─────────────────────────────────────────────────────────────

export const totpApi = {
  status: () => request<{ enabled: boolean; backupCodesRemaining: number }>('/auth/totp/status'),
  setup: () => request<{ uri: string; secret: string }>('/auth/totp/setup', { method: 'POST' }),
  verify: (code: string) =>
    request<{ backupCodes: string[] }>('/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  disable: () => request('/auth/totp/disable', { method: 'POST' }),
  regenerateCodes: () =>
    request<{ backupCodes: string[] }>('/auth/totp/regenerate-codes', { method: 'POST' }),
};

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export const chatApi = {
  send: (message: string) =>
    request<{ reply: string }>('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
};
