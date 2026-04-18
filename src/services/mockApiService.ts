import apiClient from './apiClient';
import type { User, Project, Task, AuthResponse, RiskAlert, DashboardStats } from '@/types';

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Auth Service
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', {
      fullName,
      email,
      password,
      confirmPassword,
    });
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* ignore */
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<User>('/auth/me');
      return data;
    } catch {
      return null;
    }
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<User>('/auth/me', payload);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/me/password', { currentPassword, newPassword });
  },
};

// Project Service
export const projectService = {
  getProjects: async (page = 1, limit = 6, search = '', status = ''): Promise<PaginationResponse<Project>> => {
    const params: Record<string, any> = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    const { data } = await apiClient.get<PaginationResponse<Project>>('/projects', { params });
    return data;
  },

  getProjectById: async (id: string): Promise<Project | null> => {
    try {
      const { data } = await apiClient.get<Project>(`/projects/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  createProject: async (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
  ): Promise<Project> => {
    const payload: any = { ...project };
    delete payload.manager;
    if (Array.isArray(payload.members)) {
      payload.members = payload.members.map((m: any) => (typeof m === 'string' ? m : m.id));
    }
    const { data } = await apiClient.post<Project>('/projects', payload);
    return data;
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const payload: any = { ...updates };
    delete payload.manager;
    delete payload.tasks;
    if (Array.isArray(payload.members)) {
      payload.members = payload.members.map((m: any) => (typeof m === 'string' ? m : m.id));
    }
    const { data } = await apiClient.put<Project>(`/projects/${id}`, payload);
    return data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  classifyProject: async (
    project: Partial<Project>
  ): Promise<{ classification: string; riskScore: number; complexity: string; confidence: number; modelVersion: string }> => {
    const { data } = await apiClient.post<{ classification: string; riskScore: number; complexity: string; confidence: number; modelVersion: string }>(
      '/projects/classify',
      {
        scale: project.scale,
        complexity: project.complexity,
        budget: (project as any).budget ?? 0,
        estimatedDurationDays: (project as any).estimatedDurationDays ?? 0,
        teamSize: (project as any).teamSize ?? 0,
      }
    );
    return data;
  },

  predictSchedule: async (projectId: string): Promise<any> => {
    const { data } = await apiClient.get(`/projects/${projectId}/predict-schedule`);
    return data;
  },

  getTaskRecommendations: async (projectId: string): Promise<any> => {
    const { data } = await apiClient.get(`/projects/${projectId}/task-recommendations`);
    return data;
  },

  updateProjectProgress: async (id: string, progress: number, description: string): Promise<Project> => {
    const { data } = await apiClient.post<Project>(`/projects/${id}/progress`, { progress, description });
    return data;
  },
};

// Analytics Service
export const analyticsService = {
  overview: async (): Promise<any> => {
    const { data } = await apiClient.get('/analytics/overview');
    return data;
  },
};

// Task Service
export const taskService = {
  getTasks: async (page = 1, limit = 10, projectId?: string, status?: string): Promise<PaginationResponse<Task>> => {
    const { data } = await apiClient.get<PaginationResponse<Task>>('/tasks', {
      params: { page, limit, projectId, status },
    });
    return data;
  },

  getTaskById: async (id: string): Promise<Task | null> => {
    try {
      const { data } = await apiClient.get<Task>(`/tasks/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const payload: any = { ...task };
    delete payload.assignee;
    const { data } = await apiClient.post<Task>('/tasks', payload);
    return data;
  },

  updateTaskProgress: async (id: string, progress: number, description: string): Promise<Task> => {
    const { data } = await apiClient.post<Task>(`/tasks/${id}/progress`, { progress, description });
    return data;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const payload: any = { ...updates };
    delete payload.assignee;
    const { data } = await apiClient.put<Task>(`/tasks/${id}`, payload);
    return data;
  },

  toggleSubtask: async (taskId: string, subId: string, done?: boolean): Promise<Task> => {
    const { data } = await apiClient.patch<Task>(`/tasks/${taskId}/subtasks/${subId}`, { done });
    return data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

// Dashboard Service
export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },
};

// Risk Alert Service
export const riskAlertService = {
  getRiskAlerts: async (): Promise<RiskAlert[]> => {
    const { data } = await apiClient.get<RiskAlert[]>('/alerts');
    return data;
  },

  getRiskAlertsByProject: async (projectId: string): Promise<RiskAlert[]> => {
    const { data } = await apiClient.get<RiskAlert[]>(`/alerts/project/${projectId}`);
    return data;
  },

  evaluateProjectRisk: async (projectId: string): Promise<number> => {
    const { data } = await apiClient.post<{ riskScore: number }>(`/alerts/evaluate/${projectId}`);
    return data.riskScore;
  },

  resolveAlert: async (alertId: string): Promise<RiskAlert> => {
    const { data } = await apiClient.put<RiskAlert>(`/alerts/${alertId}/resolve`);
    return data;
  },

  deleteAlert: async (alertId: string): Promise<void> => {
    await apiClient.delete(`/alerts/${alertId}`);
  },
};

// User Service
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<User>(`/users/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  getUsersByRole: async (role: string): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users', { params: { role } });
    return data;
  },

  getPerformance: async (userId: string): Promise<any> => {
    const { data } = await apiClient.get(`/users/${userId}/performance`);
    return data;
  },
};
