import apiClient from './apiClient';

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
  getProjects: async (page = 1, limit = 6): Promise<PaginationResponse<Project>> => {
    const { data } = await apiClient.get<PaginationResponse<Project>>('/projects', {
      params: { page, limit }
    });
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
  ): Promise<{ classification: string; riskScore: number }> => {
    const { data } = await apiClient.post<{ classification: string; riskScore: number }>(
      '/projects/classify',
      {
        scale: project.scale,
        complexity: project.complexity,
        estimatedDurationDays: (project as any).estimatedDurationDays,
        teamSize: (project as any).teamSize,
      }
    );
    return data;
  },

  predictSchedule: async (projectId: string): Promise<any> => {
    const { data } = await apiClient.get(`/projects/${projectId}/predict-schedule`);
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
};
