<template>
  <div class="reports-page">
    <header class="page-header">
      <div>
        <h1>Báo cáo &amp; Phân tích AI</h1>
        <p class="subtitle">Trực quan hoá phân loại, rủi ro và hiệu suất dự án</p>
      </div>
      <button class="btn btn-outline" @click="load">🔄 Làm mới</button>
    </header>

    <div v-if="loading" class="loading-grid">
      <div class="card"><div class="skeleton" style="height: 140px;"></div></div>
      <div class="card"><div class="skeleton" style="height: 140px;"></div></div>
      <div class="card"><div class="skeleton" style="height: 140px;"></div></div>
      <div class="card"><div class="skeleton" style="height: 140px;"></div></div>
    </div>

    <template v-else-if="data">
      <div class="kpi-grid">
        <div class="card kpi" v-for="k in kpis" :key="k.label">
          <span class="kpi-icon" :style="{ background: k.color }">{{ k.icon }}</span>
          <div>
            <p class="kpi-label">{{ k.label }}</p>
            <p class="kpi-value">{{ k.value }}</p>
            <p class="kpi-hint">{{ k.hint }}</p>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <section class="card chart-card">
          <h3>Phân loại AI</h3>
          <DonutChart :data="classificationData" centerLabel="Tổng" />
        </section>

        <section class="card chart-card">
          <h3>Phân bố rủi ro</h3>
          <DonutChart :data="riskData" centerLabel="Dự án" />
        </section>

        <section class="card chart-card span-2">
          <h3>Trạng thái dự án</h3>
          <BarChart :data="statusData" />
        </section>

        <section class="card chart-card span-2">
          <h3>Trạng thái công việc</h3>
          <BarChart :data="taskStatusData" />
        </section>
      </div>

      <section class="card">
        <div class="section-head">
          <h3>Top dự án rủi ro cao</h3>
          <span class="muted">Xếp hạng theo điểm rủi ro AI</span>
        </div>
        <div v-if="!data.topRiskProjects.length" class="empty-inline">Chưa có dữ liệu</div>
        <table v-else class="tbl">
          <thead>
            <tr>
              <th>Dự án</th>
              <th>Phân loại</th>
              <th>Trạng thái</th>
              <th>Tiến độ</th>
              <th>Điểm rủi ro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in data.topRiskProjects" :key="p.id">
              <td class="strong">{{ p.name }}</td>
              <td>{{ p.classification || '—' }}</td>
              <td><span class="badge" :class="'badge-' + badgeOf(p.status)">{{ p.status }}</span></td>
              <td style="min-width: 160px;">
                <div class="progress-bar"><div class="fill" :style="{ width: p.progress + '%' }"></div></div>
                <span class="pg-val">{{ p.progress }}%</span>
              </td>
              <td>
                <span class="risk-pill" :class="riskClass(p.riskScore)">{{ p.riskScore }}</span>
              </td>
              <td>
                <router-link :to="`/projects/${p.id}`" class="btn btn-outline btn-sm">Xem</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { analyticsService } from '@/services/mockApiService';
import DonutChart from '@/components/DonutChart.vue';
import BarChart from '@/components/BarChart.vue';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const data = ref<any>(null);
const loading = ref(true);

const kpis = computed(() => {
  if (!data.value) return [];
  return [
    { label: 'Dự án', value: data.value.totalProjects, hint: 'Tổng dự án đang quản lý', icon: '📁', color: '#EEF2FF' },
    { label: 'Công việc', value: data.value.totalTasks, hint: 'Tổng số task', icon: '✓', color: '#CFFAFE' },
    { label: 'Tỷ lệ đúng hạn', value: data.value.onTimeRate + '%', hint: 'Dự án hoàn thành đúng hạn', icon: '🎯', color: '#DCFCE7' },
    { label: 'Cảnh báo active', value: data.value.activeAlerts, hint: 'Đang chờ xử lý', icon: '⚠️', color: '#FEF3C7' },
  ];
});

const classificationData = computed(() => {
  const d = data.value?.byClassification || {};
  return [
    { label: 'Loại A - Phức tạp', value: d.A || 0, color: '#EF4444' },
    { label: 'Loại B - Trung bình', value: d.B || 0, color: '#F59E0B' },
    { label: 'Loại C - Đơn giản', value: d.C || 0, color: '#10B981' },
    { label: 'Chưa phân loại', value: d.NA || 0, color: '#94A3B8' },
  ].filter((x) => x.value > 0);
});

const riskData = computed(() => {
  const d = data.value?.byRisk || {};
  return [
    { label: 'Cao', value: d.HIGH || 0, color: '#EF4444' },
    { label: 'Trung bình', value: d.MEDIUM || 0, color: '#F59E0B' },
    { label: 'Thấp', value: d.LOW || 0, color: '#10B981' },
  ].filter((x) => x.value > 0);
});

const statusData = computed(() => {
  const d = data.value?.byStatus || {};
  return [
    { label: 'Chờ bắt đầu', value: d.PENDING || 0, color: '#64748B' },
    { label: 'Đang thực hiện', value: d.IN_PROGRESS || 0, color: '#3B82F6' },
    { label: 'Hoàn thành', value: d.COMPLETED || 0, color: '#10B981' },
    { label: 'Trễ hạn', value: d.DELAYED || 0, color: '#EF4444' },
  ];
});

const taskStatusData = computed(() => {
  const d = data.value?.taskByStatus || {};
  return [
    { label: 'Chưa bắt đầu', value: d.TODO || 0, color: '#94A3B8' },
    { label: 'Đang làm', value: d.IN_PROGRESS || 0, color: '#3B82F6' },
    { label: 'Review', value: d.REVIEW || 0, color: '#06B6D4' },
    { label: 'Hoàn thành', value: d.DONE || 0, color: '#10B981' },
  ];
});

const badgeOf = (s: string) => {
  const x = (s || '').toUpperCase();
  if (x === 'COMPLETED') return 'success';
  if (x === 'DELAYED') return 'danger';
  if (x === 'IN_PROGRESS') return 'warning';
  return 'neutral';
};

const riskClass = (s: number) => (s >= 65 ? 'high' : s >= 35 ? 'mid' : 'low');

async function load() {
  loading.value = true;
  try {
    data.value = await analyticsService.overview();
  } catch (e: any) {
    toast.error(e.message || 'Không tải được báo cáo');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.reports-page { display: flex; flex-direction: column; gap: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.subtitle { color: var(--text-muted); font-size: 15px; margin-top: 4px; }

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.kpi { display: flex; align-items: center; gap: 16px; padding: 20px; }
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 26px; font-weight: 800; color: var(--text-main); font-family: 'Outfit', sans-serif; margin: 2px 0; }
.kpi-hint { font-size: 12px; color: var(--text-soft); }

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-card h3 { margin-bottom: 16px; }
.span-2 { grid-column: span 1; }

.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.muted { color: var(--text-muted); font-size: 13px; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border); }
.tbl td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid var(--border); }
.tbl tr:last-child td { border-bottom: none; }
.strong { font-weight: 600; }
.pg-val { font-size: 12px; color: var(--text-muted); margin-left: 8px; }
.progress-bar { display: inline-block; width: 120px; height: 6px; vertical-align: middle; }

.risk-pill { display: inline-flex; align-items: center; padding: 4px 12px; font-weight: 800; font-size: 13px; border-radius: 999px; }
.risk-pill.high { background: var(--danger-soft); color: var(--danger); }
.risk-pill.mid { background: var(--warning-soft); color: var(--warning); }
.risk-pill.low { background: var(--success-soft); color: var(--success); }

.empty-inline { padding: 24px; text-align: center; color: var(--text-muted); }

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
