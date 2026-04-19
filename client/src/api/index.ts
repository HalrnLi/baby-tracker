import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Baby {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordType = 'feed' | 'pump' | 'diaper' | 'weight';

export interface FeedData {
  amount: number;
  source: 'breast' | 'formula';
  time?: string;
}

export interface PumpData {
  amount: number;
  side?: 'left' | 'right' | 'both';
  time?: string;
}

export interface DiaperData {
  type: 'pee' | 'poop' | 'both';
}

export interface WeightData {
  weightKg: number;
  date?: string;
}

export interface Record {
  id: string;
  babyId: string | null;
  userId: string;
  type: RecordType;
  data: FeedData | PumpData | DiaperData | WeightData;
  createdAt: string;
  updatedAt: string;
  baby?: Pick<Baby, 'id' | 'name'>;
}

export interface Reminder {
  id: string;
  babyId: string;
  userId: string;
  type: 'pump' | 'diaper';
  intervalMinutes: number;
  enabled: boolean;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

// Auth
export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ message: string; token: string; user: User }>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<{ message: string; token: string; user: User }>('/auth/login', { email, password }),
};

// Baby
export const babyApi = {
  getAll: () => api.get<{ babies: Baby[] }>('/baby'),
  create: (data: { name: string; birthDate: string; gender: 'male' | 'female' }) =>
    api.post<{ baby: Baby }>('/baby', data),
  update: (id: string, data: { name: string; birthDate: string; gender: 'male' | 'female' }) =>
    api.put<{ baby: Baby }>(`/baby/${id}`, data),
};

// Records
export const recordsApi = {
  getAll: (params?: { baby_id?: string; type?: RecordType }) =>
    api.get<{ records: Record[] }>('/records', { params }),
  create: (data: { babyId: string; type: RecordType; data: Record['data'] }) =>
    api.post<{ record: Record }>('/records', data),
  delete: (id: string) => api.delete(`/records/${id}`),
};

// Reminders
export const remindersApi = {
  getAll: () => api.get<{ reminders: Reminder[] }>('/reminders'),
  create: (data: { babyId: string; type: 'pump' | 'diaper'; intervalMinutes: number; enabled?: boolean }) =>
    api.post<{ reminder: Reminder }>('/reminders', data),
  update: (id: string, data: { intervalMinutes?: number; enabled?: boolean }) =>
    api.put<{ reminder: Reminder }>(`/reminders/${id}`, data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
  trigger: (id: string) => api.patch<{ reminder: Reminder }>(`/reminders/${id}/trigger`),
};

// Sync
export interface SyncRecord {
  id?: string;
  babyId?: string; // Optional for pump records
  type: RecordType;
  data: Record['data'];
  clientCreatedAt: string;
}

export const syncApi = {
  getNew: (lastSync: string | null) =>
    api.get<{ records: Record[]; lastSync: string }>('/sync', {
      params: lastSync ? { lastSync } : {},
    }),
  push: (records: SyncRecord[]) =>
    api.post<{ created: Record[]; lastSync: string }>('/sync', { records }),
};

// Stats
export interface DayStats {
  date: string;
  feed: { count: number; totalAmount: number; breastCount: number; formulaCount: number };
  pump: { count: number; totalAmount: number };
  diaper: { count: number; pee: number; poop: number; both: number };
  weight: { count: number; latest: number | null };
}

export interface StatsSummary {
  feed: { totalCount: number; totalAmount: number; avgPerDay: number };
  pump: { totalCount: number; totalAmount: number };
  diaper: { totalCount: number; avgPerDay: number };
}

export interface StatsResponse {
  stats: DayStats[];
  summary: StatsSummary;
}

export const statsApi = {
  get: (params: { baby_id: string; days?: number }) =>
    api.get<StatsResponse>('/stats', { params }),
};

export default api;
