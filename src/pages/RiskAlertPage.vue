<template>
  <div class="alerts-container">
    <header class="page-header">
      <div>
        <h1>Cảnh Báo Rủi Ro AI</h1>
        <p class="subtitle">Đánh giá và xử lý các nguy cơ chậm trễ dự án từ Machine Learning</p>
      </div>
      <button @click="refreshAlerts" class="btn btn-primary">
        <span class="icon">🔄</span> Cập Nhật Dữ Liệu
      </button>
    </header>

    <div class="stats-overview">
      <div class="card stat-card danger">
        <div class="stat-icon">🚨</div>
        <div class="stat-info">
          <span class="stat-label">Rủi Ro Cao</span>
          <span class="stat-value">{{ highRiskCount }}</span>
        </div>
      </div>
      <div class="card stat-card warning">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <span class="stat-label">Trung Bình</span>
          <span class="stat-value">{{ mediumRiskCount }}</span>
        </div>
      </div>
      <div class="card stat-card info">
        <div class="stat-icon">💡</div>
        <div class="stat-info">
          <span class="stat-label">Rủi Ro Thấp</span>
          <span class="stat-value">{{ lowRiskCount }}</span>
        </div>
      </div>
      <div class="card stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-label">Đã Giải Quyết</span>
          <span class="stat-value">{{ resolvedCount }}</span>
        </div>
      </div>
    </div>

    <div class="card filter-bar">
      <div class="filter-group">
        <label>Mức độ rủi ro</label>
        <select v-model="filterSeverity" class="form-control">
          <option value="">Tất cả mức độ</option>
          <option value="HIGH">Rủi ro cao (Đỏ)</option>
          <option value="MEDIUM">Trung bình (Vàng)</option>
          <option value="LOW">Rủi ro thấp (Xanh)</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Trạng thái xử lý</label>
        <select v-model="filterStatus" class="form-control">
          <option value="active">Cảnh báo đang hoạt động</option>
          <option value="resolved">Đã xử lý xong</option>
          <option value="all">Xem tất cả</option>
        </select>
      </div>
    </div>

    <div class="alerts-grid">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="card alert-card"
        :class="[{ 'resolved-op': alert.resolved }]"
      >
        <div class="alert-status-strip" :class="'severity-' + alert.severity.toLowerCase()"></div>
        
        <div class="alert-header">
          <div class="alert-project-info">
            <h3>{{ alert.projectName }}</h3>
            <p class="alert-timestamp">Phát hiện: {{ formatDate(alert.createdAt) }}</p>
          </div>
          <div class="alert-badges">
            <span class="badge" :class="'badge-' + getBadgeType(alert.severity)">
              {{ alert.severity }}
            </span>
          </div>
        </div>

        <div class="alert-body">
          <p class="alert-msg">{{ alert.message }}</p>

          <div class="risk-meter">
            <div class="meter-info">
              <span>Chỉ số nguy cơ AI</span>
              <strong>{{ alert.riskScore }}%</strong>
            </div>
            <div class="meter-track">
              <div class="meter-fill" :style="{ width: alert.riskScore + '%' }" :class="'bg-' + getBadgeType(alert.severity)"></div>
            </div>
          </div>

          <div class="alert-footer">
            <button @click="viewProjectDetails(alert.projectId)" class="btn btn-ghost btn-sm">
              Xem dự án →
            </button>
            <div class="footer-actions">
              <button v-if="!alert.resolved" @click="dismissAlert(alert.id)" class="btn-icon">🗑️</button>
              <button
                v-if="!alert.resolved"
                @click="markAsResolved(alert.id)"
                class="btn btn-primary btn-sm"
              >
                Giải quyết
              </button>
              <span v-else class="resolved-tag">✓ Đã xử lý</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredAlerts.length === 0" class="empty-state">
      <div class="empty-icon">🛡️</div>
      <p>Không có cảnh báo rủi ro nào cần xử lý lúc này</p>
    </div>

    <!-- Risk Assessment Panel -->
    <section class="assessment-section">
      <div class="section-header">
        <h2>Phân Tích Chi Tiết Đề Xuất AI</h2>
        <p>AI dự báo dựa trên lịch sử hoạt động và tiến độ thực tế</p>
      </div>

      <div class="analysis-grid">
        <div v-for="project in projectsWithRisk" :key="project.id" class="card analysis-card">
          <div class="analysis-header">
            <h4>{{ project.name }}</h4>
            <span class="status-indicator">{{ project.status }}</span>
          </div>

          <div class="analysis-metrics">
            <div class="metric-row">
              <span class="m-label">Tiến độ kỳ vọng:</span>
              <span class="m-value">{{ expectedProgress(project) }}%</span>
            </div>
            <div class="metric-row">
              <span class="m-label">Tiến độ thực tế:</span>
              <span class="m-value" :class="{ 'text-danger': project.progress < expectedProgress(project) }">
                {{ project.progress }}%
              </span>
            </div>
            <div class="metric-row highlight">
              <span class="m-label">Độ lệch tiến độ:</span>
              <span class="m-value" :class="{ 'text-danger': project.progress < expectedProgress(project) }">
                {{ Math.round(project.progress - expectedProgress(project)) }}%
              </span>
            </div>
          </div>

          <div class="ai-recommendation">
            <div class="rec-icon">🤖</div>
            <div class="rec-text">
              <strong>Khuyến nghị AI:</strong>
              <p>{{ getRiskRecommendation(project) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { RiskAlert, Project } from '@/types';
import { riskAlertService, projectService } from '@/services/mockApiService';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const toast = useToast();
const alerts = ref<RiskAlert[]>([]);
const projects = ref<Project[]>([]);
const filterSeverity = ref('');
const filterStatus = ref('active');

const highRiskCount = computed(() => alerts.value.filter(a => a.severity === 'HIGH' && !a.resolved).length);
const mediumRiskCount = computed(() => alerts.value.filter(a => a.severity === 'MEDIUM' && !a.resolved).length);
const lowRiskCount = computed(() => alerts.value.filter(a => a.severity === 'LOW' && !a.resolved).length);
const resolvedCount = computed(() => alerts.value.filter(a => a.resolved).length);

const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    if (filterSeverity.value && alert.severity !== filterSeverity.value) return false;
    if (filterStatus.value === 'active' && alert.resolved) return false;
    if (filterStatus.value === 'resolved' && !alert.resolved) return false;
    return true;
  });
});

const projectsWithRisk = computed(() => {
  return projects.value
    .map(p => ({
      ...p,
      risk: p.ai_risk_score,
    }))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 6);
});

const getBadgeType = (severity: string) => {
  if (severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'info';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const expectedProgress = (project: Project) => {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = new Date().getTime();
  const total = end - start;
  const elapsed = now - start;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
};

const getRiskRecommendation = (project: Project) => {
  const expected = expectedProgress(project);
  const actual = project.progress;
  const diff = actual - expected;

  if (diff >= 10) return 'Dự án đang vượt tiến độ xuất sắc. Hãy tối ưu nguồn lực sang dự án chậm hơn.';
  if (diff >= 0) return 'Dự án đang bám sát kế hoạch. Duy trì kiểm soát các cột mốc tiếp theo.';
  if (diff >= -10) return 'Dự án có dấu hiệu chậm lại. Cần họp team để rà soát các điểm nghẽn (bottlenecks).';
  return 'Dự án đang trễ hạn nghiêm trọng. Đề xuất tăng cường nhân sự hoặc điều chỉnh deadline.';
};

const markAsResolved = async (alertId: string) => {
  try {
    await riskAlertService.resolveAlert(alertId);
    const found = alerts.value.find(a => a.id === alertId);
    if (found) found.resolved = true;
    toast.success('Đã đánh dấu giải quyết cảnh báo');
  } catch (error: any) {
    toast.error(error.message || 'Không cập nhật được cảnh báo');
  }
};

const dismissAlert = async (alertId: string) => {
  try {
    await (riskAlertService as any).deleteAlert(alertId);
    alerts.value = alerts.value.filter(a => a.id !== alertId);
    toast.success('Đã xoá cảnh báo');
  } catch (e: any) {
    toast.error(e.message || 'Không xoá được cảnh báo');
  }
};

const viewProjectDetails = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const refreshAlerts = async () => {
  try {
    alerts.value = await riskAlertService.getRiskAlerts();
    toast.success('Đã cập nhật danh sách cảnh báo');
  } catch (error: any) {
    toast.error(error.message || 'Không tải được cảnh báo');
  }
};

onMounted(async () => {
  try {
    const [alertsList, projectsRes] = await Promise.all([
      riskAlertService.getRiskAlerts(),
      projectService.getProjects(1, 100),
    ]);
    alerts.value = alertsList;
    projects.value = projectsRes.data;
  } catch (error: any) {
    toast.error(error.message || 'Không tải được dữ liệu');
  }
});
</script>

<style scoped>
.alerts-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-card.danger { border-left: 4px solid var(--danger); }
.stat-card.warning { border-left: 4px solid var(--warning); }
.stat-card.info { border-left: 4px solid var(--primary); }
.stat-card.success { border-left: 4px solid var(--success); }

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 24px;
  padding: 16px 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

.form-control {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: white;
  font-size: 14px;
  outline: none;
}

/* Alerts Grid */
.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.alert-card {
  position: relative;
  padding: 0;
  overflow: hidden;
  transition: transform 0.2s;
}

.alert-card:hover {
  transform: translateY(-4px);
}

.alert-status-strip {
  height: 4px;
  width: 100%;
}

.severity-high { background: var(--danger); }
.severity-medium { background: var(--warning); }
.severity-low { background: var(--success); }

.alert-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border);
}

.alert-project-info h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.alert-timestamp {
  font-size: 12px;
  color: var(--text-muted);
}

.alert-body {
  padding: 24px;
}

.alert-msg {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  color: var(--text-main);
}

.risk-meter {
  background: var(--bg-main);
  padding: 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 24px;
}

.meter-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
}

.meter-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 3px;
}

.bg-danger { background: var(--danger); }
.bg-warning { background: var(--warning); }
.bg-info { background: var(--primary); }

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resolved-op {
  opacity: 0.6;
}

.resolved-tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--success);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
}

/* Assessment Section */
.assessment-section {
  margin-top: 24px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.section-header p {
  color: var(--text-muted);
  font-size: 14px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.analysis-card {
  padding: 20px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.analysis-header h4 {
  font-size: 15px;
  margin: 0;
}

.status-indicator {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
}

.analysis-metrics {
  margin-bottom: 20px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.metric-row.highlight {
  border-bottom: none;
  font-weight: 700;
}

.m-label { color: var(--text-muted); }
.text-danger { color: var(--danger); }

.ai-recommendation {
  display: flex;
  gap: 12px;
  background: #EFF6FF;
  padding: 12px;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--primary);
}

.rec-icon { font-size: 20px; }
.rec-text strong {
  display: block;
  font-size: 12px;
  color: var(--primary);
  margin-bottom: 4px;
}
.rec-text p {
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
  color: #1E40AF;
}

.empty-state {
  text-align: center;
  padding: 64px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }
}
</style>
