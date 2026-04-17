<template>
  <div v-if="loading" class="loading-state">
    <div class="skeleton" style="width: 240px; height: 28px;"></div>
    <div class="skeleton" style="width: 100%; height: 140px; margin-top: 16px;"></div>
  </div>

  <div v-else-if="!project" class="empty-state">
    <h2>Không tìm thấy dự án</h2>
    <button class="btn btn-outline" @click="$router.push('/projects')">Quay lại danh sách</button>
  </div>

  <div v-else class="detail-page">
    <div class="breadcrumb">
      <router-link to="/projects">← Danh sách dự án</router-link>
    </div>

    <header class="detail-header card">
      <div class="header-main">
        <div class="title-row">
          <h1>{{ project.name }}</h1>
          <span class="badge" :class="'badge-' + badgeOf(project.status)">{{ project.status }}</span>
        </div>
        <p class="description">{{ project.description || 'Chưa có mô tả' }}</p>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="m-label">Quản lý</span>
            <span class="m-value">{{ project.manager?.fullName || 'N/A' }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">Thành viên</span>
            <span class="m-value">{{ project.members?.length || 0 }} người</span>
          </div>
          <div class="meta-item">
            <span class="m-label">Quy mô</span>
            <span class="m-value">{{ getScaleLabel(project.scale) }} · {{ getComplexityLabel(project.complexity) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">Ngân sách</span>
            <span class="m-value">{{ formatCurrency(project.budget) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">Ngày bắt đầu</span>
            <span class="m-value">{{ formatDate(project.startDate) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label">Hạn kết thúc</span>
            <span class="m-value">{{ formatDate(project.endDate) }}</span>
          </div>
        </div>
      </div>

      <div class="header-side">
        <div class="ai-chip">
          <span class="chip-label">Phân loại AI</span>
          <span class="chip-value">{{ project.ai_classification || '—' }}</span>
        </div>

        <div class="ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              :stroke="progressColor" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="`${(project.progress || 0) * 3.14} 314`"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="62" text-anchor="middle" dominant-baseline="middle"
                  style="font-size: 22px; font-weight: 800; fill: var(--text-main);">
              {{ project.progress || 0 }}%
            </text>
          </svg>
          <p class="ring-label">Tiến độ</p>
        </div>

        <button class="btn btn-primary btn-block" :disabled="predicting" @click="runPrediction">
          {{ predicting ? 'AI đang phân tích...' : '🤖 Dự đoán tiến độ' }}
        </button>
      </div>
    </header>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- TASKS TAB - Kanban Board -->
    <section v-if="tab === 'tasks'" class="kanban-section">
      <div class="section-head">
        <h3>Công việc ({{ tasks.length }})</h3>
      </div>
      <div v-if="!tasks.length" class="card empty-inline">Chưa có công việc nào trong dự án này</div>
      <div v-else class="kanban-board">
        <!-- Cột Khởi tạo -->
        <div class="kanban-col">
          <div class="kanban-col-header todo">
            <span class="col-dot todo"></span>
            <span class="col-title">Khởi tạo</span>
            <span class="col-count">{{ todoTasks.length }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in todoTasks" :key="t.id" class="kanban-card">
              <div class="kc-priority">
                <span class="pri-dot" :class="'pri-' + t.priority.toLowerCase()"></span>
                <span class="kc-priority-label">{{ t.priority }}</span>
              </div>
              <h4 class="kc-title">{{ t.title }}</h4>
              <p class="kc-desc">{{ t.description || '' }}</p>
              <div class="kc-footer">
                <div class="kc-assignee">
                  <span class="kc-avatar">{{ (t.assignee?.fullName || '?').charAt(0) }}</span>
                  <span>{{ t.assignee?.fullName || '—' }}</span>
                </div>
                <span class="kc-due" :class="{ 'text-danger': isOverdue(t.dueDate) }">{{ formatDate(t.dueDate) }}</span>
              </div>
              <div class="kc-progress">
                <div class="kc-progress-track"><div class="kc-progress-fill" :style="{ width: t.progress + '%' }"></div></div>
                <span class="kc-progress-val">{{ t.progress }}%</span>
              </div>
            </div>
            <div v-if="!todoTasks.length" class="kanban-empty">Không có task</div>
          </div>
        </div>

        <!-- Cột Đang làm -->
        <div class="kanban-col">
          <div class="kanban-col-header inprogress">
            <span class="col-dot inprogress"></span>
            <span class="col-title">Đang thực hiện</span>
            <span class="col-count">{{ inProgressTasks.length }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in inProgressTasks" :key="t.id" class="kanban-card">
              <div class="kc-priority">
                <span class="pri-dot" :class="'pri-' + t.priority.toLowerCase()"></span>
                <span class="kc-priority-label">{{ t.priority }}</span>
              </div>
              <h4 class="kc-title">{{ t.title }}</h4>
              <p class="kc-desc">{{ t.description || '' }}</p>
              <div class="kc-footer">
                <div class="kc-assignee">
                  <span class="kc-avatar">{{ (t.assignee?.fullName || '?').charAt(0) }}</span>
                  <span>{{ t.assignee?.fullName || '—' }}</span>
                </div>
                <span class="kc-due" :class="{ 'text-danger': isOverdue(t.dueDate) && t.status !== 'DONE' }">{{ formatDate(t.dueDate) }}</span>
              </div>
              <div class="kc-progress">
                <div class="kc-progress-track"><div class="kc-progress-fill" :style="{ width: t.progress + '%' }"></div></div>
                <span class="kc-progress-val">{{ t.progress }}%</span>
              </div>
            </div>
            <div v-if="!inProgressTasks.length" class="kanban-empty">Không có task</div>
          </div>
        </div>

        <!-- Cột Hoàn thành -->
        <div class="kanban-col">
          <div class="kanban-col-header done">
            <span class="col-dot done"></span>
            <span class="col-title">Hoàn thành</span>
            <span class="col-count">{{ doneTasks.length }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in doneTasks" :key="t.id" class="kanban-card completed-card">
              <div class="kc-priority">
                <span class="pri-dot" :class="'pri-' + t.priority.toLowerCase()"></span>
                <span class="kc-priority-label">{{ t.priority }}</span>
              </div>
              <h4 class="kc-title">{{ t.title }}</h4>
              <div class="kc-footer">
                <div class="kc-assignee">
                  <span class="kc-avatar done-avatar">{{ (t.assignee?.fullName || '?').charAt(0) }}</span>
                  <span>{{ t.assignee?.fullName || '—' }}</span>
                </div>
                <span class="kc-due">✓ {{ formatDate(t.completedAt || t.dueDate) }}</span>
              </div>
              <div class="kc-progress">
                <div class="kc-progress-track"><div class="kc-progress-fill done-fill" style="width: 100%"></div></div>
                <span class="kc-progress-val">100%</span>
              </div>
            </div>
            <div v-if="!doneTasks.length" class="kanban-empty">Không có task</div>
          </div>
        </div>
      </div>
    </section>

    <!-- PREDICTION TAB -->
    <section v-if="tab === 'prediction'" class="card">
      <div class="section-head">
        <h3>Dự đoán tiến độ AI</h3>
        <span class="muted">Model: {{ prediction?.modelVersion || 'chưa chạy' }}</span>
      </div>

      <div v-if="!prediction" class="empty-inline">
        Nhấn "Dự đoán tiến độ" để AI phân tích. Hoặc
        <button class="btn btn-outline btn-sm" @click="runPrediction">Chạy ngay</button>
      </div>

      <div v-else class="prediction-grid">
        <div class="pred-card">
          <p class="pred-label">Hạn ban đầu</p>
          <p class="pred-value">{{ formatDate(prediction.originalEndDate) }}</p>
        </div>
        <div class="pred-card highlight">
          <p class="pred-label">Hạn dự đoán</p>
          <p class="pred-value">{{ formatDate(prediction.predictedEndDate) }}</p>
          <span class="pred-delta" :class="prediction.predictedDelayDays > 0 ? 'bad' : 'good'">
            {{ prediction.predictedDelayDays > 0 ? `Trễ ${prediction.predictedDelayDays} ngày` : 'Đúng hạn' }}
          </span>
        </div>
        <div class="pred-card">
          <p class="pred-label">Tiến độ kỳ vọng</p>
          <p class="pred-value">{{ prediction.expectedProgress }}%</p>
        </div>
        <div class="pred-card">
          <p class="pred-label">Chỉ số rủi ro</p>
          <p class="pred-value" :class="riskClass(prediction.riskScore)">{{ prediction.riskScore }}</p>
        </div>
      </div>

      <div v-if="prediction" class="recommendation">
        <div class="rec-icon">🤖</div>
        <div>
          <p class="rec-title">Khuyến nghị AI</p>
          <p class="rec-text">{{ prediction.recommendation }}</p>
        </div>
      </div>

      <div v-if="prediction?.taskPredictions?.length" class="task-pred">
        <h4>Phân tích cấp công việc</h4>
        <div class="task-pred-list">
          <div v-for="tp in prediction.taskPredictions" :key="tp.id" class="tp-row" :class="{ 'at-risk': tp.atRisk }">
            <div class="tp-main">
              <span class="tp-title">{{ tp.title }}</span>
              <span class="muted">{{ tp.assignee?.fullName || '—' }}</span>
            </div>
            <div class="tp-meta">
              <span class="badge" :class="'badge-' + badgeOf(tp.status)">{{ tp.status }}</span>
              <span class="tp-days" :class="tp.daysRemaining < 0 ? 'text-danger' : ''">
                {{ tp.daysRemaining < 0 ? `Quá hạn ${-tp.daysRemaining}d` : `Còn ${tp.daysRemaining}d` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MEMBERS TAB -->
    <section v-if="tab === 'members'" class="card">
      <div class="section-head">
        <h3>Thành viên ({{ project.members?.length || 0 }})</h3>
      </div>
      <div class="members-grid">
        <div v-for="m in project.members" :key="m.id" class="member-card">
          <div class="m-avatar">{{ (m.fullName || '?').split(' ').slice(-2).map(s => s[0]).join('').toUpperCase() }}</div>
          <div class="m-info">
            <p class="m-name">{{ m.fullName }}</p>
            <p class="m-mail" :title="m.email">{{ m.email }}</p>
          </div>
          <span class="badge badge-neutral">{{ getRoleLabel(m.role) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Project, Task } from '@/types';
import { projectService, taskService } from '@/services/mockApiService';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const toast = useToast();

const project = ref<Project | null>(null);
const tasks = ref<Task[]>([]);
const loading = ref(true);
const tab = ref<'tasks' | 'prediction' | 'members'>('tasks');
const prediction = ref<any>(null);
const predicting = ref(false);

const tabs = [
  { key: 'tasks', label: 'Công việc' },
  { key: 'prediction', label: 'Dự đoán tiến độ' },
  { key: 'members', label: 'Thành viên' },
];

const progressColor = computed(() => {
  const p = project.value?.progress || 0;
  if (p >= 70) return 'var(--success)';
  if (p >= 40) return 'var(--warning)';
  return 'var(--danger)';
});

const badgeOf = (s: string) => {
  const x = (s || '').toUpperCase();
  if (['DONE', 'COMPLETED'].includes(x)) return 'success';
  if (['DELAYED'].includes(x)) return 'danger';
  if (['IN_PROGRESS'].includes(x)) return 'warning';
  if (['REVIEW'].includes(x)) return 'info';
  return 'neutral';
};

const riskClass = (s: number) => (s >= 65 ? 'text-danger' : s >= 35 ? 'text-warning' : 'text-success');

const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const formatCurrency = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';
const isOverdue = (d: any) => d && new Date(d) < new Date();

const todoTasks = computed(() => tasks.value.filter(t => t.status === 'TODO'));
const inProgressTasks = computed(() => tasks.value.filter(t => ['IN_PROGRESS', 'REVIEW'].includes(t.status)));
const doneTasks = computed(() => tasks.value.filter(t => t.status === 'DONE'));

const getScaleLabel = (scale: string) => {
  const map: Record<string, string> = { SMALL: 'Nhỏ', MEDIUM: 'Vừa', LARGE: 'Lớn' };
  return map[scale] || scale;
};

const getComplexityLabel = (c: string) => {
  const map: Record<string, string> = { LOW: 'Đơn giản', MEDIUM: 'Trung bình', HIGH: 'Phức tạp' };
  return map[c] || c;
};

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = { ADMIN: 'Quản trị', PROJECT_MANAGER: 'Quản lý', MEMBER: 'Thành viên' };
  return map[role] || role;
};

async function runPrediction() {
  if (!project.value) return;
  predicting.value = true;
  try {
    prediction.value = await (projectService as any).predictSchedule(project.value.id);
    tab.value = 'prediction';
    toast.success('AI đã hoàn tất phân tích', 'Dự đoán tiến độ');
  } catch (e: any) {
    toast.error(e.message || 'Lỗi AI');
  } finally {
    predicting.value = false;
  }
}

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const [p, tsRes] = await Promise.all([
      projectService.getProjectById(id),
      taskService.getTasks(1, 200, id),
    ]);
    project.value = p;
    tasks.value = tsRes.data;
  } catch (e: any) {
    toast.error(e.message || 'Không tải được dữ liệu');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 20px; }
.breadcrumb a { color: var(--text-muted); font-size: 13px; font-weight: 500; }
.breadcrumb a:hover { color: var(--primary); }

.detail-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 28px;
}
.title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.description { color: var(--text-muted); margin-bottom: 20px; }
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.m-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.m-value { font-size: 14px; font-weight: 600; color: var(--text-main); }

.header-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 220px;
}
.ai-chip {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 10px 16px;
  background: var(--primary-soft);
  border-radius: var(--radius-sm);
}
.chip-label { font-size: 11px; color: var(--primary); font-weight: 700; text-transform: uppercase; }
.chip-value { font-size: 14px; font-weight: 700; color: var(--primary-hover); }
.ring-wrap { display: flex; flex-direction: column; align-items: center; }
.ring-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.tabs {
  display: flex;
  gap: 4px;
  background: white;
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  width: fit-content;
}
.tab {
  padding: 8px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: all 0.18s var(--ease);
  font-family: inherit;
}
.tab:hover { color: var(--text-main); }
.tab.active { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; }

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.muted { color: var(--text-muted); font-size: 13px; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-muted); padding: 10px 12px; border-bottom: 1px solid var(--border); font-weight: 700; letter-spacing: 0.5px; }
.tbl td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid var(--border); }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover { background: var(--bg-subtle); }

.task-title { display: flex; align-items: center; gap: 10px; font-weight: 500; }
.pri-dot { width: 8px; height: 8px; border-radius: 50%; }
.pri-high { background: var(--danger); }
.pri-medium { background: var(--warning); }
.pri-low { background: var(--success); }

.progress-bar { display: inline-block; width: 100px; height: 6px; vertical-align: middle; }
.progress-val { margin-left: 8px; font-size: 12px; color: var(--text-muted); }

.empty-inline { padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; }
.loading-state, .empty-state { padding: 40px; text-align: center; }

.prediction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.pred-card {
  padding: 16px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.pred-card.highlight {
  background: linear-gradient(135deg, var(--primary-soft), var(--secondary-soft));
  border-color: var(--primary);
}
.pred-label { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
.pred-value { font-size: 22px; font-weight: 800; color: var(--text-main); font-family: 'Outfit', sans-serif; }
.pred-delta { display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.pred-delta.bad { background: var(--danger-soft); color: var(--danger); }
.pred-delta.good { background: var(--success-soft); color: var(--success); }
.text-warning { color: var(--warning); }

.recommendation {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: var(--primary-soft);
  border-left: 4px solid var(--primary);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}
.rec-icon { font-size: 24px; }
.rec-title { font-size: 12px; color: var(--primary); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
.rec-text { font-size: 14px; color: var(--text-main); margin: 0; line-height: 1.5; }

.task-pred h4 { margin-bottom: 12px; }
.task-pred-list { display: flex; flex-direction: column; gap: 8px; }
.tp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.tp-row.at-risk { border-left: 4px solid var(--danger); background: #FFFBFB; }
.tp-main { display: flex; flex-direction: column; }
.tp-title { font-size: 14px; font-weight: 600; }
.tp-meta { display: flex; align-items: center; gap: 12px; }
.tp-days { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  min-width: 0;
  transition: all 0.2s ease;
}
.member-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.m-info {
  flex: 1;
  min-width: 0;
}
.member-card .badge-neutral {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  margin-left: 8px;
  padding: 2px 8px;
  letter-spacing: 0.5px;
}
.m-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  font-size: 14px;
}
.m-name { 
  font-size: 14px; 
  font-weight: 600; 
  margin: 0; 
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.m-mail { 
  font-size: 12px; 
  color: var(--text-muted); 
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 900px) {
  .detail-header { grid-template-columns: 1fr; }
  .header-side { flex-direction: row; justify-content: center; flex-wrap: wrap; }
  .kanban-board { grid-template-columns: 1fr; }
}

/* Kanban Board */
.kanban-section {
  margin-top: 4px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  min-height: 300px;
}

.kanban-col {
  background: #F8FAFC;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: white;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.col-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.col-dot.todo { background: #94A3B8; }
.col-dot.inprogress { background: #F59E0B; }
.col-dot.done { background: #10B981; }

.col-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.col-count {
  margin-left: auto;
  background: var(--border);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.kanban-cards {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.kanban-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  transition: all 0.2s ease;
  cursor: default;
}

.kanban-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
  transform: translateY(-2px);
}

.completed-card {
  opacity: 0.75;
}

.kc-priority {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.kc-priority-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kc-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: var(--text-main);
  line-height: 1.4;
}

.kc-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.kc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.kc-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-main);
  font-weight: 500;
}

.kc-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.done-avatar {
  background: linear-gradient(135deg, #10B981, #059669);
}

.kc-due {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.kc-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kc-progress-track {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.kc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.done-fill {
  background: linear-gradient(90deg, #10B981, #059669);
}

.kc-progress-val {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}

.kanban-empty {
  text-align: center;
  padding: 24px 16px;
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}
</style>
