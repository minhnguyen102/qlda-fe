<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRolePermissions, getRoleLabel } from '@/utils/roleUtils'
import { authService } from '@/services/mockApiService'
import ToastContainer from '@/components/ToastContainer.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userRole = ref<string>('')
const userName = ref<string>('')
const userEmail = ref<string>('')
const userAvatar = ref<string>('')
const menuOpen = ref(false)

const isBlankLayout = computed(() => route.meta.layout === 'blank')
const permissions = computed(() => getRolePermissions(userRole.value as any) || {})
const initials = computed(() => (userName.value || 'U').split(' ').slice(-2).map(s => s[0]).join('').toUpperCase())

function loadUser() {
  userRole.value = localStorage.getItem('userRole') || ''
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const u = JSON.parse(userStr)
      userName.value = u.fullName || ''
      userEmail.value = u.email || ''
      userAvatar.value = u.avatar || ''
    } catch { /* ignore */ }
  }
}

async function handleLogout() {
  menuOpen.value = false
  try { await authService.logout() } catch { /* ignore */ }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  toast.success('Đã đăng xuất')
  router.push('/login')
}

onMounted(loadUser)
watch(() => route.fullPath, loadUser)
</script>

<template>
  <div class="app" :class="{ 'app-blank': isBlankLayout }">
    <aside v-if="!isBlankLayout" class="sidebar">
      <div class="brand">
        <div class="brand-logo">H</div>
        <div>
          <h2>HiNET</h2>
          <p>Project Management</p>
        </div>
      </div>

      <nav class="nav-menu">
        <p class="nav-section">Không gian làm việc</p>
        <router-link v-if="permissions.canViewDashboard" to="/dashboard" class="nav-link">
          <span class="nav-icon">📊</span> Dashboard
        </router-link>
        <router-link v-if="permissions.canViewProjects" to="/projects" class="nav-link">
          <span class="nav-icon">📁</span> Dự án
        </router-link>
        <router-link v-if="permissions.canViewTasks" to="/tasks" class="nav-link">
          <span class="nav-icon">✅</span> Công việc
        </router-link>
        <router-link v-if="permissions.canViewAlerts" to="/alerts" class="nav-link">
          <span class="nav-icon">⚠️</span> Cảnh báo rủi ro
        </router-link>

        <p class="nav-section">Phân tích</p>
        <router-link v-if="permissions.canViewReports" to="/reports" class="nav-link">
          <span class="nav-icon">🤖</span> Báo cáo &amp; AI
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card" @click="menuOpen = !menuOpen">
          <div class="avatar">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="user-info">
            <p class="user-name">{{ userName || 'Người dùng' }}</p>
            <p class="user-role">{{ getRoleLabel(userRole as any) }}</p>
          </div>
          <span class="caret">▾</span>

          <div v-if="menuOpen" class="user-menu" @click.stop>
            <router-link to="/profile" class="menu-item" @click="menuOpen = false">
              Hồ sơ cá nhân
            </router-link>
            <button class="menu-item danger" @click="handleLogout">Đăng xuất</button>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>

    <ToastContainer />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
  background: var(--bg-main);
}
.app-blank { display: block; }

.sidebar {
  width: 264px;
  background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
  color: var(--text-inverse);
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  z-index: 100;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  font-size: 18px;
  box-shadow: var(--shadow-primary);
}
.brand h2 {
  color: white;
  font-size: 18px;
  margin: 0;
  letter-spacing: -0.01em;
}
.brand p {
  color: #94A3B8;
  font-size: 11px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-section {
  color: #64748B;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin: 18px 14px 8px;
}
.nav-section:first-child { margin-top: 4px; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: #CBD5E1;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: all 0.18s var(--ease);
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}
.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.9;
}
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
.nav-link.router-link-active .nav-icon { opacity: 1; }

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.18s var(--ease);
}
.user-card:hover { 
  background: rgba(255, 255, 255, 0.08); 
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; color: white; margin: 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.user-role { font-size: 11px; color: #94A3B8; margin: 0; }

.caret { color: #64748B; font-size: 12px; }

.user-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 12px;
  right: 12px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: slideUp 0.18s var(--ease);
}
.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text-main);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.menu-item:hover { background: var(--accent); }
.menu-item.danger { color: var(--danger); border-top: 1px solid var(--border); }
.menu-item.danger:hover { background: var(--danger-soft); }

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  min-width: 0;
}

@media (max-width: 1024px) {
  .sidebar { width: 220px; }
  .main-content { padding: 24px; }
}

@media (max-width: 768px) {
  .app { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: sticky; }
  .nav-menu { flex-direction: row; overflow-x: auto; padding: 8px; }
  .nav-section { display: none; }
  .nav-link { white-space: nowrap; padding: 8px 12px; }
  .sidebar-footer { display: none; }
}
</style>
