/**
 * Central API client — all database/backend calls go through here.
 * Points to your Express API server (runs on Oracle Cloud alongside MySQL).
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
    window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/account/login';
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

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  /** Verify password (+ optional OTP) for step-up auth */
  verifyPassword: (password: string, otp_code?: string) =>
    request<{ valid: boolean }>('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password, otp_code }),
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
  resolved_service_name?: string | null;
  service_description?: string | null;
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
  role: string | null;
  created_at: string;
}

export const customersApi = {
  list: () => request<Customer[]>('/admin/customers'),
  create: (data: { full_name: string; email: string; phone?: string; password: string }) =>
    request<{ id: string; email: string; tempPassword: string }>('/admin/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendReset: (id: string) =>
    request<{ message: string }>(`/admin/customers/${id}/send-reset`, { method: 'POST' }),
  delete: (id: string) =>
    request(`/admin/customers/${id}`, { method: 'DELETE' }),
};

// ─── Service Credentials ─────────────────────────────────────────────────────

export interface ServiceCredential {
  id: string;
  user_id: string;
  service_id: string | null;
  service_name: string;
  username: string | null;
  password: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  has_password?: boolean;
}

export const credentialsApi = {
  // Admin endpoints
  listForCustomer: (customerId: string) =>
    request<ServiceCredential[]>(`/admin/customers/${customerId}/credentials`),
  createForCustomer: (customerId: string, data: Partial<ServiceCredential>) =>
    request<ServiceCredential>(`/admin/customers/${customerId}/credentials`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateForCustomer: (customerId: string, credId: string, data: Partial<ServiceCredential>) =>
    request<ServiceCredential>(`/admin/customers/${customerId}/credentials/${credId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteForCustomer: (customerId: string, credId: string) =>
    request(`/admin/customers/${customerId}/credentials/${credId}`, { method: 'DELETE' }),

  // Customer-facing endpoints
  mine: () => request<ServiceCredential[]>('/account/credentials'),

  // Step-up verification to reveal a credential's password
  reveal: (credentialId: string, password: string, otpCode?: string) =>
    request<{ id: string; service_name: string; username: string | null; password: string | null; notes: string | null }>(
      '/account/credentials/verify',
      {
        method: 'POST',
        body: JSON.stringify({ credential_id: credentialId, password, otp_code: otpCode }),
      }
    ),
};

// ─── API Status ──────────────────────────────────────────────────────────────

export interface ApiStatusResponse {
  database: { status: string; url: string; db: string };
  llm: { status: string; url: string; models: string[] };
  backend: { status: string; port: string; version: string };
}

interface ApiStatusRaw {
  database: { status: string; url?: string; db?: string };
  llm: { status: string; endpoint?: string; url?: string; availableModels?: string[]; models?: string[]; model?: string };
  backend: { status: string; port?: string; version?: string };
}

export const apiStatusApi = {
  get: async (): Promise<ApiStatusResponse> => {
    const raw = await request<ApiStatusRaw>('/admin/api-status');
    return {
      database: {
        status: raw.database.status,
        url: raw.database.url || 'unknown',
        db: raw.database.db || 'stream_connect',
      },
      llm: {
        status: raw.llm.status,
        url: raw.llm.endpoint || raw.llm.url || 'unknown',
        models: raw.llm.availableModels || raw.llm.models || (raw.llm.model ? [raw.llm.model] : []),
      },
      backend: {
        status: raw.backend.status,
        port: raw.backend.port || '3000',
        version: raw.backend.version || '1.0.0',
      },
    };
  },
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
  phone: string | null;
  created_at: string;
  user_created_at?: string;
  user_updated_at?: string;
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
  list: () => request<Array<{ key: string; value: string | null }>>('/admin/settings'),
  save: (settings: Record<string, string>) =>
    request('/admin/settings', { method: 'POST', body: JSON.stringify(settings) }),
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

// ─── Admin AI Operations ─────────────────────────────────────────────────────

export const adminOpsApi = {
  prompt: (prompt: string, model?: string, context?: any) =>
    request<{ response: string; model: string; hasProposedActions: boolean; timestamp: string }>(
      '/admin/ops/prompt', { method: 'POST', body: JSON.stringify({ prompt, model, context }) }
    ),
  approve: (actionId: string, actionDescription: string) =>
    request<{ status: string; message: string }>('/admin/ops/approve', {
      method: 'POST', body: JSON.stringify({ actionId, actionDescription }),
    }),
  auditLog: (limit = 50, offset = 0) =>
    request<{ entries: any[]; total: number }>(`/admin/ops/audit-log?limit=${limit}&offset=${offset}`),
  health: () => request<any>('/admin/ops/health'),
  security: () => request<any>('/admin/ops/security'),
  n8nTrigger: (workflow: string, payload?: any) =>
    request<any>('/admin/ops/n8n/trigger', { method: 'POST', body: JSON.stringify({ workflow, payload }) }),
};

// ─── Services (Admin CRUD) ───────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price_bzd: number;
  category: string | null;
  billing_period: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const servicesApi = {
  list: () => request<Service[]>('/admin/services'),
  create: (data: Partial<Service>) =>
    request<{ id: string }>('/admin/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Service>) =>
    request('/admin/services/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) =>
    request('/admin/services/' + id, { method: 'DELETE' }),
};

// ─── Public Services (no auth) ──────────────────────────────────────────────

async function publicRequest<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export const publicServicesApi = {
  list: () => publicRequest<Service[]>('/services'),
};
