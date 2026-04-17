<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Chào mừng trở lại, {{ currentUser?.fullName }}</p>
      </div>
    </header>

    <div class="stats-grid">
      <div class="card stat-card total">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <span class="stat-label">Tổng Dự Án</span>
          <p class="stat-number">{{ stats.totalProjects }}</p>
        </div>
      </div>
      <div class="card stat-card active">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <span class="stat-label">Đang Thực Hiện</span>
          <p class="stat-number">{{ stats.activeProjects }}</p>
        </div>
      </div>
      <div class="card stat-card delayed">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <span class="stat-label">Dự Án Trễ</span>
          <p class="stat-number">{{ stats.delayedProjects }}</p>
        </div>
      </div>
      <div class="card stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <span class="stat-label">Hoàn Thành</span>
          <p class="stat-number">{{ stats.completedProjects }}</p>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <!-- Projects Overview -->
      <section class="card section projects-section">
        <div class="section-header">
          <h2>Dự Án Nổi Bật</h2>
          <router-link to="/projects" class="link-btn">Xem tất cả</router-link>
        </div>
        
        <div class="projects-list">
          <div
            v-for="project in projects.slice(0, 3)"
            :key="project.id"
            class="project-item"
            @click="$router.push(`/projects/${project.id}`)"
          >
            <div class="project-info">
              <div class="project-title-row">
                <h3>{{ project.name }}</h3>
                <span class="badge" :class="'badge-' + getBadgeType(project.status)">
                  {{ project.status }}
                </span>
              </div>
              <p class="project-desc">{{ project.description }}</p>
              
              <div class="project-meta">
                <span class="ai-tag">
                  <span class="tag-icon">🤖</span> {{ project.ai_classification }}
                </span>
                <span class="risk-indicator" :class="getRiskClass(project.ai_risk_score)">
                  Risk: {{ project.ai_risk_score }}%
                </span>
              </div>

              <div class="progress-container">
                <div class="progress-header">
                  <span>Tiến độ</span>
                  <span>{{ project.progress }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: project.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tasks Overview -->
      <section class="card section tasks-section">
        <div class="section-header">
          <h2>Công Việc Gần Đây</h2>
          <router-link to="/tasks" class="link-btn">Xem tất cả</router-link>
        </div>

        <div class="tasks-list">
          <div
            v-for="task in tasks.slice(0, 5)"
            :key="task.id"
            class="task-item-compact"
          >
            <div class="task-info">
              <h4>{{ task.title }}</h4>
              <p class="task-project">{{ getProjectName(task.projectId) }}</p>
            </div>
            <div class="task-meta">
              <span class="badge badge-sm" :class="'badge-' + getBadgeType(task.status)">
                {{ task.status }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Risk Alerts Section -->
    <section class="card section alerts-section">
      <div class="section-header">
        <h2>Phân Tích Rủi Ro & Cảnh Báo AI</h2>
        <router-link to="/alerts" class="link-btn">Phân tích chi tiết</router-link>
      </div>

      <div class="alerts-grid">
        <div
          v-for="alert in alerts.slice(0, 3)"
          :key="alert.id"
          class="alert-item"
          :class="'severity-' + alert.severity.toLowerCase()"
        >
          <div class="alert-icon">🔔</div>
          <div class="alert-content">
            <div class="alert-header-row">
              <h4>{{ alert.projectName }}</h4>
              <span class="severity-tag">{{ alert.severity }} RISK</span>
            </div>
            <p class="alert-msg">{{ alert.message }}</p>
            <div class="alert-footer-row">
              <div class="risk-bar-container">
                <div class="risk-bar-fill" :style="{ width: alert.riskScore + '%' }"></div>
              </div>
              <span class="risk-percent">{{ alert.riskScore }}% Score</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { User, Project, Task, DashboardStats, RiskAlert } from '@/types';
import {
  dashboardService,
  projectService,
  taskService,
  riskAlertService,
} from '@/services/mockApiService';
import { getRolePermissions } from '@/utils/roleUtils';

const currentUser = ref<User | null>(null);
const userRole = ref<string>('');
const stats = ref<DashboardStats>({
  totalProjects: 0,
  activeProjects: 0,
  delayedProjects: 0,
  completedProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  assignedToMe: 0,
  overdueTasks: 0,
});
const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);
const alerts = ref<RiskAlert[]>([]);

const permissions = computed(() => {
  return getRolePermissions(userRole.value as any) || {}
});

const getProjectName = (projectId: string) => {
  return projects.value.find(p => p.id === projectId)?.name || 'Unknown Project';
};

const getBadgeType = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'COMPLETED' || s === 'DONE') return 'success';
  if (s === 'DELAYED' || s === 'IN_PROGRESS') return 'warning';
  if (s === 'TODO' || s === 'PENDING') return 'info';
  return 'info';
};

const getRiskClass = (score: number) => {
  if (score > 70) return 'risk-high';
  if (score > 30) return 'risk-medium';
  return 'risk-low';
};

onMounted(async () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
  }
  
  const role = localStorage.getItem('userRole');
  if (role) {
    userRole.value = role;
  }

  try {
    const [dashStats, projectsRes, tasksRes, alertsList] = await Promise.all([
      dashboardService.getDashboardStats(),
      projectService.getProjects(1, 100),
      taskService.getTasks(1, 100),
      riskAlertService.getRiskAlerts(),
    ]);

    stats.value = dashStats;
    projects.value = projectsRes.data;
    tasks.value = tasksRes.data;
    alerts.value = alertsList;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.dashboard-header h1 {
  font-size: 32px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 16px;
}

.btn-outline {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-main);
}

.btn-outline:hover {
  background: var(--accent);
  border-color: var(--primary);
  color: var(--primary);
}

/* Stats Section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  color: var(--text-main);
  margin: 0;
}

.stat-card.total .stat-icon { background: #E0E7FF; }
.stat-card.active .stat-icon { background: #E0F2FE; }
.stat-card.delayed .stat-icon { background: #FEF3C7; }
.stat-card.completed .stat-icon { background: #DCFCE7; }

/* Content Layout */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
}

.link-btn {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
}

/* Projects List */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  transition: all 0.2s;
  cursor: pointer;
}

.project-item:hover {
  border-color: var(--primary);
  background: var(--accent);
}

.project-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-title-row h3 {
  font-size: 16px;
  margin: 0;
}

.project-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-tag {
  background: #EEF2FF;
  color: #4338CA;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.risk-indicator {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.risk-high { background: #FEE2E2; color: #991B1B; }
.risk-medium { background: #FEF3C7; color: #92400E; }
.risk-low { background: #DCFCE7; color: #166534; }

.progress-container {
  margin-top: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.progress-bar-bg {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 4px;
}

/* Tasks Sidebar */
.task-item-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.task-item-compact:hover {
  background: var(--accent);
  border-color: var(--border);
}

.task-item-compact h4 {
  font-size: 14px;
  margin: 0 0 2px;
}

.task-project {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.badge-sm {
  padding: 2px 8px;
  font-size: 10px;
}

/* Alerts Section */
.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.alert-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: white;
}

.alert-icon {
  font-size: 20px;
  padding-top: 4px;
}

.alert-content {
  flex: 1;
}

.alert-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-header-row h4 {
  font-size: 16px;
  margin: 0;
}

.severity-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.severity-high .severity-tag { background: #FEE2E2; color: #EF4444; }
.severity-medium .severity-tag { background: #FEF3C7; color: #F59E0B; }
.severity-low .severity-tag { background: #DCFCE7; color: #10B981; }

.alert-msg {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

.alert-footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.risk-bar-container {
  flex: 1;
  height: 6px;
  background: var(--accent);
  border-radius: 3px;
  overflow: hidden;
}

.risk-bar-fill {
  height: 100%;
  background: var(--danger);
}

.risk-percent {
  font-size: 12px;
  font-weight: 700;
  color: var(--danger);
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
