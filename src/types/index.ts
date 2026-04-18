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
  aiAssessments?: AiAssessment[];
  latestAiAssessment?: AiAssessment | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssessment {
  _id?: string;
  date: string;
  computedProgress: number;
  riskScore: number;
  expectedProgress: number;
  predictedDelayDays: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  headline: string;
  summary: string;
  recommendation: string;
  triggerType: string;
  triggerTaskId?: string | null;
  triggerUserId?: string | null;
  modelVersion?: string;
}

export interface ProgressLog {
  _id?: string;
  userId: string | User;
  progress: number;
  description: string;
  date: string;
}

// Subtask Types
export interface Subtask {
  _id?: string;
  id?: string;
  title: string;
  done: boolean;
  assigneeId?: string | null;
  createdAt?: string;
  completedAt?: string | null;
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
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  subtasks?: Subtask[];
  aiAssessment?: {
    headline: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    summary: string;
    recommendation: string;
    riskScore: number;
    expectedProgress: number;
    computedProgress: number;
    predictedDelayDays: number;
    stats?: { totalTasks: number; doneTasks: number; overdueTasks: number; atRiskTasks: number };
  };
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
