<template>
  <div class="profile-page">
    <header class="page-header">
      <div>
        <h1>Hồ sơ cá nhân</h1>
        <p class="subtitle">Quản lý thông tin tài khoản và bảo mật</p>
      </div>
    </header>

    <div class="layout">
      <section class="card profile-card">
        <div class="avatar-big">
          <img v-if="form.avatar" :src="form.avatar" :alt="form.fullName" />
          <span v-else>{{ initials }}</span>
        </div>
        <h2>{{ form.fullName || 'Người dùng' }}</h2>
        <p class="muted">{{ form.email }}</p>
        <span class="badge badge-info">{{ roleLabel }}</span>

        <div class="quick-info">
          <div>
            <p class="qi-label">Phòng ban</p>
            <p class="qi-value">{{ form.department || '—' }}</p>
          </div>
          <div>
            <p class="qi-label">Vị trí</p>
            <p class="qi-value">{{ form.position || '—' }}</p>
          </div>
        </div>
      </section>

      <!-- AI Performance Card -->
      <section v-if="performance" class="card perf-card" :class="'perf-grade-' + gradeClass">
        <div class="perf-header">
          <span class="perf-icon">🤖</span>
          <div>
            <h3 style="margin:0">AI đánh giá hiệu suất</h3>
            <p class="muted" style="margin:0; font-size:12px;">Dựa trên công việc được giao</p>
          </div>
        </div>

        <div class="perf-score-block">
          <div class="perf-score">
            <span class="perf-score-val">{{ performance.score }}</span>
            <span class="perf-score-unit">/100</span>
          </div>
          <div class="perf-grade">{{ performance.grade }}</div>
          <div class="perf-headline">{{ performance.headline }}</div>
        </div>

        <div class="perf-stats">
          <div class="perf-stat">
            <span class="ps-label">Hoàn thành</span>
            <span class="ps-value">{{ performance.completionRate }}%</span>
          </div>
          <div class="perf-stat">
            <span class="ps-label">Đúng hạn</span>
            <span class="ps-value">{{ performance.onTimeRate }}%</span>
          </div>
          <div class="perf-stat">
            <span class="ps-label">Quá hạn</span>
            <span class="ps-value" :class="{ 'text-danger': performance.overdueTasks > 0 }">
              {{ performance.overdueTasks }}
            </span>
          </div>
          <div class="perf-stat">
            <span class="ps-label">Tổng việc</span>
            <span class="ps-value">{{ performance.totalTasks }}</span>
          </div>
        </div>

        <p class="perf-summary">{{ performance.summary }}</p>
        <div class="perf-rec">
          <strong>Gợi ý AI:</strong>
          <span>{{ performance.recommendation }}</span>
        </div>
      </section>

      <section class="card form-card">
        <div class="tabs">
          <button class="tab" :class="{ active: tab === 'info' }" @click="tab = 'info'">Thông tin</button>
          <button class="tab" :class="{ active: tab === 'password' }" @click="tab = 'password'">Đổi mật khẩu</button>
        </div>

        <form v-if="tab === 'info'" @submit.prevent="saveProfile">
          <div class="form-group">
            <label>Họ và tên</label>
            <input v-model="form.fullName" type="text" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input :value="form.email" type="email" disabled />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phòng ban</label>
              <input v-model="form.department" type="text" placeholder="VD: Phòng Giải pháp" />
            </div>
            <div class="form-group">
              <label>Vị trí</label>
              <input v-model="form.position" type="text" placeholder="VD: Senior Developer" />
            </div>
          </div>
          <div class="form-group">
            <label>URL ảnh đại diện</label>
            <input v-model="form.avatar" type="text" placeholder="https://..." />
          </div>
          <button class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Đang lưu...' : 'Cập nhật thông tin' }}
          </button>
        </form>

        <form v-else @submit.prevent="savePassword">
          <div class="form-group">
            <label>Mật khẩu hiện tại</label>
            <input v-model="pw.current" type="password" required />
          </div>
          <div class="form-group">
            <label>Mật khẩu mới</label>
            <input v-model="pw.new" type="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input v-model="pw.confirm" type="password" required />
          </div>
          <button class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Đang đổi...' : 'Đổi mật khẩu' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { authService, userService } from '@/services/mockApiService';
import { useToast } from '@/composables/useToast';
import { getRoleLabel } from '@/utils/roleUtils';

interface MemberPerformance {
  score: number;
  grade: string;
  headline: string;
  summary: string;
  recommendation: string;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completionRate: number;
  onTimeRate: number;
  velocity: number;
}

const toast = useToast();
const tab = ref<'info' | 'password'>('info');
const saving = ref(false);

const form = ref({
  fullName: '',
  email: '',
  avatar: '',
  department: '',
  position: '',
  role: 'MEMBER' as any,
});

const pw = ref({ current: '', new: '', confirm: '' });
const performance = ref<MemberPerformance | null>(null);

const gradeClass = computed(() => {
  const g = performance.value?.grade || '';
  if (g.startsWith('A')) return 'a';
  if (g.startsWith('B')) return 'b';
  if (g.startsWith('C')) return 'c';
  if (g.startsWith('D')) return 'd';
  return 'na';
});

async function loadPerformance(userId: string) {
  try {
    performance.value = await (userService as any).getPerformance(userId);
  } catch {
    performance.value = null;
  }
}

const initials = computed(() =>
  (form.value.fullName || 'U').split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase()
);

const roleLabel = computed(() => getRoleLabel(form.value.role));

async function saveProfile() {
  saving.value = true;
  try {
    const updated = await (authService as any).updateProfile({
      fullName: form.value.fullName,
      avatar: form.value.avatar,
      department: form.value.department,
      position: form.value.position,
    });
    localStorage.setItem('user', JSON.stringify(updated));
    toast.success('Đã cập nhật thông tin');
  } catch (e: any) {
    toast.error(e.message || 'Không cập nhật được');
  } finally {
    saving.value = false;
  }
}

async function savePassword() {
  if (pw.value.new !== pw.value.confirm) {
    toast.error('Mật khẩu xác nhận không khớp');
    return;
  }
  saving.value = true;
  try {
    await (authService as any).changePassword(pw.value.current, pw.value.new);
    pw.value = { current: '', new: '', confirm: '' };
    toast.success('Đã đổi mật khẩu');
  } catch (e: any) {
    toast.error(e.message || 'Không đổi được mật khẩu');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  const u = localStorage.getItem('user');
  if (u) {
    const parsed = JSON.parse(u);
    form.value = {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      avatar: parsed.avatar || '',
      department: parsed.department || '',
      position: parsed.position || '',
      role: parsed.role || 'MEMBER',
    };
    const uid = parsed.id || parsed._id || localStorage.getItem('userId');
    if (uid) loadPerformance(uid);
  }
});
</script>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.subtitle { color: var(--text-muted); font-size: 15px; margin-top: 4px; }

.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.profile-card {
  text-align: center;
  padding: 32px 24px;
}
.avatar-big {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  overflow: hidden;
  box-shadow: var(--shadow-primary);
}
.avatar-big img { width: 100%; height: 100%; object-fit: cover; }
.profile-card h2 { margin-bottom: 4px; }
.muted { color: var(--text-muted); font-size: 14px; margin-bottom: 12px; }

.quick-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  text-align: left;
}
.qi-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.qi-value { font-size: 14px; font-weight: 600; color: var(--text-main); margin-top: 2px; }

.form-card { padding: 28px; }
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}
.tab {
  padding: 10px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  font-family: inherit;
  margin-bottom: -1px;
}
.tab:hover { color: var(--text-main); }
.tab.active { color: var(--primary); border-bottom-color: var(--primary); }

.form-group { margin-bottom: 18px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* AI Performance Card */
.perf-card {
  padding: 20px;
  margin-top: 16px;
  border-top: 4px solid var(--primary);
}
.perf-grade-a { border-top-color: #16a34a; background: linear-gradient(180deg, #f0fdf4, #ffffff); }
.perf-grade-b { border-top-color: #2563eb; }
.perf-grade-c { border-top-color: #f59e0b; background: linear-gradient(180deg, #fffbeb, #ffffff); }
.perf-grade-d { border-top-color: #ef4444; background: linear-gradient(180deg, #fef2f2, #ffffff); }
.perf-grade-na { border-top-color: var(--border); }

.perf-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.perf-icon { font-size: 24px; }

.perf-score-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 14px;
}
.perf-score { display: flex; align-items: baseline; }
.perf-score-val {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  line-height: 1;
}
.perf-score-unit { font-size: 14px; color: var(--text-muted); margin-left: 2px; }
.perf-grade {
  font-size: 18px;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--primary);
  color: white;
}
.perf-grade-a .perf-grade { background: #16a34a; }
.perf-grade-b .perf-grade { background: #2563eb; }
.perf-grade-c .perf-grade { background: #f59e0b; }
.perf-grade-d .perf-grade { background: #ef4444; }

.perf-headline { font-size: 13px; font-weight: 700; color: var(--text-main); margin-left: auto; }

.perf-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.perf-stat {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 10px 6px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.ps-label { font-size: 10px; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px; }
.ps-value { font-size: 18px; font-weight: 800; color: var(--text-main); margin-top: 2px; }
.text-danger { color: var(--danger); }

.perf-summary { font-size: 13px; color: var(--text-main); line-height: 1.5; margin: 0 0 10px 0; }
.perf-rec {
  font-size: 12.5px;
  padding: 10px 12px;
  background: #eff6ff;
  border-left: 3px solid var(--primary);
  border-radius: 6px;
}
.perf-rec strong { color: var(--primary); margin-right: 6px; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .perf-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
