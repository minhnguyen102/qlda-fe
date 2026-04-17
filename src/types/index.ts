// User Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER';
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  managerId: string;
  manager: User;
  scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  budget: number;
  clientName: string;
  ai_classification: string; // "Loại A - Phức tạp cao" | "Loại B - Trung bình" | etc.
  ai_risk_score: number; // 0 - 100
  progress: number; // 0 - 100
  tasks: Task[];
  members: User[];
  progressLogs?: ProgressLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressLog {
  _id?: string;
  userId: string | User;
  progress: number;
  description: string;
  date: string;
}

// Task Types
export interface Task {
  id: string;
  projectId: string;
  assigneeId: string;
  assignee: User;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate: string;
  progress: number; // 0 - 100
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  progressLogs?: ProgressLog[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  assignedToMe: number;
  overdueTasks: number;
}

// Risk Alert
export interface RiskAlert {
  id: string;
  projectId: string;
  projectName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  riskScore: number;
  createdAt: string;
  resolved: boolean;
}
