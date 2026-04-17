<template>
  <div class="projects-container">
    <header class="page-header">
      <div>
        <h1>Danh Sách Dự Án</h1>
        <p class="subtitle">Quản lý và theo dõi tiến độ các dự án HiNET</p>
      </div>
      <button v-if="permissions.canCreateProject" @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">+</span> Tạo Dự Án Mới
      </button>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="search" type="text" placeholder="Tìm theo tên, mô tả..." />
      </div>
      <select v-model="filterStatus">
        <option value="">Tất cả trạng thái</option>
        <option value="PENDING">Chờ bắt đầu</option>
        <option value="IN_PROGRESS">Đang thực hiện</option>
        <option value="COMPLETED">Hoàn thành</option>
        <option value="DELAYED">Trễ hạn</option>
      </select>
    </div>

    <div v-if="!filteredProjects.length" class="empty-state card">
      <div class="empty-icon">📭</div>
      <p>Không tìm thấy dự án phù hợp</p>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="card card-interactive project-card"
        @click="openProject(project)"
      >
        <div class="card-header-row">
          <div class="status-dropdown">
            <span 
              class="badge status-badge" 
              :class="'badge-' + getBadgeType(project.status)"
              @click.stop="toggleStatusMenu(project.id)"
            >
              {{ getStatusLabel(project.status) }}
              <span class="chevron-down">▾</span>
            </span>
            <div v-if="activeStatusMenu === project.id" class="status-menu" v-click-outside="() => activeStatusMenu = null">
              <div 
                v-for="s in getAvailableStatuses(project.status)" 
                :key="s"
                class="status-option"
                :class="{ active: project.status === s }"
                @click.stop="updateProjectStatus(project, s)"
              >
                {{ getStatusLabel(s) }}
              </div>
            </div>
          </div>
          <div class="actions">
            <button @click.stop="viewProgressLogs(project)" class="btn-icon" title="Lịch sử tiến độ">🕒</button>
            <button @click.stop="openProgressModal(project)" class="btn-icon" title="Cập nhật tiến độ">📈</button>
            <button v-if="permissions.canEditProject" @click.stop="editProject(project)" class="btn-icon" title="Sửa dự án">✏️</button>
          </div>
        </div>

        <div class="project-content">
          <h3>{{ project.name }}</h3>
          <p class="description">{{ project.description }}</p>

          <div class="project-meta-grid">
            <div class="meta-item">
              <span class="label">Người Quản Lý</span>
              <span class="value">{{ project.manager?.fullName || 'N/A' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Quy Mô</span>
              <span class="value">{{ getScaleLabel(project.scale) }}</span>
            </div>
          </div>

          <div class="ai-insight-box">
            <div class="insight-item">
              <span class="insight-label">Phân loại AI</span>
              <span class="classification-tag">{{ project.ai_classification }}</span>
            </div>
            <div class="insight-item">
              <span class="insight-label">Rủi ro trễ</span>
              <span class="risk-badge" :class="getRiskClass(project.ai_risk_score)">
                {{ project.ai_risk_score }}%
              </span>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-info">
              <span>Tiến độ hoàn thành</span>
              <span class="progress-val">{{ project.progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar-fill" :style="{ width: project.progress + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <div class="task-stats">
            <span class="stat-icon">📋</span>
            <strong>{{ project.tasks?.length || 0 }}</strong> Công việc
          </div>
          <div class="date-range">
            {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section">
      <div class="pagination-wrapper">
        <button 
          class="page-nav-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(1)"
          title="Trang đầu"
        >
          «
        </button>
        <button 
          class="page-nav-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
          title="Trang trước"
        >
          ‹
        </button>
        
        <div class="pagination-numbers">
          <template v-for="page in totalPages" :key="page">
            <button 
              v-if="shouldShowPage(page)"
              class="page-num-btn" 
              :class="{ active: currentPage === page }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <span v-else-if="shouldShowEllipsis(page)" class="pagination-dots">...</span>
          </template>
        </div>

        <button 
          class="page-nav-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
          title="Trang sau"
        >
          ›
        </button>
        <button 
          class="page-nav-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(totalPages)"
          title="Trang cuối"
        >
          »
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="card modal-content">
        <header class="modal-header">
          <h2>{{ isEditing ? 'Chỉnh sửa dự án' : 'Khởi tạo dự án mới' }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </header>

        <form @submit.prevent="handleSaveProject" class="project-form">
          <div class="form-group">
            <label>Tên Dự Án *</label>
            <input v-model="formData.name" type="text" placeholder="Nhập tên dự án..." required />
          </div>

          <div class="form-group">
            <label>Mô tả mục tiêu</label>
            <textarea v-model="formData.description" placeholder="Mô tả ngắn gọn về dự án..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ngày bắt đầu</label>
              <input v-model="formData.startDate" type="date" required />
            </div>
            <div class="form-group">
              <label>Hạn hoàn thành</label>
              <input v-model="formData.endDate" type="date" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Trạng thái</label>
              <select 
                v-model="formData.status" 
                class="form-select"
                :disabled="isEditing && currentProjectOriginStatus === 'COMPLETED'"
              >
                <option 
                  v-for="s in ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']" 
                  :key="s" 
                  :value="s"
                  :disabled="isEditing && STATUS_RANK[s] < STATUS_RANK[currentProjectOriginStatus]"
                >
                  {{ getStatusLabel(s) }} ({{ s === currentProjectOriginStatus ? 'Hiện tại' : (STATUS_RANK[s] < STATUS_RANK[currentProjectOriginStatus] ? 'Đã qua' : 'Bước tiếp') }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Danh mục dự án</label>
              <select v-model="formData.category" required>
                <option value="" disabled>-- Chọn danh mục --</option>
                <option value="Phần mềm">Phần mềm</option>
                <option value="Hạ tầng">Hạ tầng</option>
                <option value="Tư vấn">Tư vấn</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ngân sách (VNĐ)</label>
              <input v-model.number="formData.budget" type="number" placeholder="Ví dụ: 500000000" />
            </div>
            <div class="form-group">
              <label>Tên Khách Hàng</label>
              <input v-model="formData.clientName" type="text" placeholder="Nhập tên đối tác/khách hàng..." />
            </div>
          </div>

          <div class="form-group">
            <label>Thành viên tham gia</label>
            <div class="member-selection-wrapper">
              <select class="form-control" @change="addMember($event)">
                <option value="" selected disabled>+ Chọn thành viên tham gia...</option>
                <option 
                  v-for="user in allUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ formData.memberIds.includes(user.id) ? '✓ ' : '' }}{{ user.fullName }} ({{ user.role }})
                </option>
              </select>
              
              <div v-if="formData.memberIds.length > 0" class="members-chips-list">
                <div v-for="id in formData.memberIds" :key="id" class="member-chip">
                  <span class="chip-avatar">{{ getUserName(id).charAt(0) }}</span>
                  <span class="chip-name">{{ getUserName(id) }}</span>
                  <span class="remove-chip" @click="removeMember(id)">×</span>
                </div>
              </div>
            </div>
          </div>

          <div class="classification-preview" v-if="classificationMessage || savingProject">
            <div class="ai-loader" v-if="savingProject">
              <div class="spinner"></div>
              <span>AI đang phân tích dữ liệu...</span>
            </div>
            <p v-else class="classification-result">
              <span class="icon">🤖</span> {{ classificationMessage }}
            </p>
          </div>

          <div class="modal-footer-actions">
            <button type="button" @click="closeModal" class="btn btn-ghost">Hủy bỏ</button>
            <button type="submit" class="btn btn-primary" :disabled="savingProject">
              {{ isEditing ? 'Cập nhật dự án' : 'Tạo & Phân loại AI' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Update Progress Modal -->
    <div v-if="showProgressModal" class="modal-overlay">
      <div class="card modal-content">
        <header class="modal-header">
          <h2>Cập nhật tiến độ dự án</h2>
          <button @click="closeProgressModal" class="btn-close">×</button>
        </header>
        <form @submit.prevent="handleUpdateProgress" class="project-form">
          <div class="form-group">
            <label>Tiến độ hoàn thành ({{ progressData.progress }}%)</label>
            <input v-model.number="progressData.progress" type="range" min="0" max="100" class="range-input" />
          </div>
          <div class="form-group">
            <label>Mô tả việc đã làm *</label>
            <textarea v-model="progressData.description" placeholder="Hôm nay bạn đã làm được những gì?..." required style="min-height: 100px;"></textarea>
          </div>
          <div class="modal-footer-actions">
            <button type="button" @click="closeProgressModal" class="btn btn-ghost">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="savingProgress">Lưu tiến độ</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Progress Log History Modal -->
    <div v-if="showLogModal" class="modal-overlay">
      <div class="card modal-content" style="max-width: 600px;">
        <header class="modal-header">
          <h2>Lịch sử cập nhật tiến độ</h2>
          <button @click="closeLogModal" class="btn-close">×</button>
        </header>
        <div class="logs-container">
          <div v-if="!selectedProjectLogs || selectedProjectLogs.length === 0" class="empty-state">
            <p>Chưa có lịch sử cập nhật nào.</p>
          </div>
          <div v-else class="log-timeline">
            <div v-for="(log, idx) in selectedProjectLogs" :key="idx" class="log-item">
              <div class="log-header">
                <strong>{{ getLogUserName(log.userId) }}</strong> đã cập nhật thành <strong style="color:var(--primary)">{{ log.progress }}%</strong>
              </div>
              <p class="log-desc">{{ log.description }}</p>
              <span class="log-date">{{ new Date(log.date).toLocaleString('vi-VN') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Project, User, ProgressLog } from '@/types';
import { projectService, userService } from '@/services/mockApiService';
import { getRolePermissions } from '@/utils/roleUtils';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const toast = useToast();
const projects = ref<Project[]>([]);
const showCreateModal = ref(false);
const isEditing = ref(false);
const savingProject = ref(false);
const allUsers = ref<User[]>([]);
const classificationMessage = ref('');

// Progress Log States
const showProgressModal = ref(false);
const savingProgress = ref(false);
const progressData = ref({ projectId: '', progress: 0, description: '' });

const showLogModal = ref(false);
const selectedProjectLogs = ref<ProgressLog[]>([]);

const STATUS_RANK: Record<string, number> = {
  'PENDING': 1,
  'IN_PROGRESS': 2,
  'DELAYED': 2,
  'COMPLETED': 3
};

const userRole = ref<string>('');
const search = ref('');
const filterStatus = ref('');
const activeStatusMenu = ref<string | null>(null);
const currentProjectOriginStatus = ref<string>('PENDING');

// Pagination state
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const pageSize = 6;

const paginationStart = computed(() => (currentPage.value - 1) * pageSize + 1);
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, totalItems.value));

const permissions = computed(() => {
  return getRolePermissions(userRole.value as any) || {}
});

const filteredProjects = computed(() => {
  const s = search.value.trim().toLowerCase();
  return projects.value;
});

const openProject = (p: Project) => router.push(`/projects/${p.id}`);

const getUserName = (id: string) => {
  return allUsers.value.find(u => u.id === id)?.fullName || 'N/A';
};

const addMember = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const userId = select.value;
  if (userId) {
    if (!formData.value.memberIds.includes(userId)) {
      formData.value.memberIds.push(userId);
    } else {
      removeMember(userId);
    }
  }
  select.value = '';
};

const removeMember = (id: string) => {
  formData.value.memberIds = formData.value.memberIds.filter(mId => mId !== id);
};

const fetchProjects = async () => {
  try {
    const response = await projectService.getProjects(currentPage.value, pageSize);
    projects.value = response.data;
    totalPages.value = response.pagination.pages;
    totalItems.value = response.pagination.total;
  } catch (error: any) {
    toast.error(error.message || 'Không tải được danh sách dự án');
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const shouldShowPage = (page: number) => {
  if (totalPages.value <= 7) return true;
  if (page === 1 || page === totalPages.value) return true;
  return Math.abs(page - currentPage.value) <= 1;
};

const shouldShowEllipsis = (page: number) => {
  return (page === 2 && currentPage.value > 3) || 
         (page === totalPages.value - 1 && currentPage.value < totalPages.value - 2);
};

const toggleStatusMenu = (id: string) => {
  activeStatusMenu.value = activeStatusMenu.value === id ? null : id;
};

const updateProjectStatus = async (project: Project, newStatus: string) => {
  if (project.status === newStatus) {
    activeStatusMenu.value = null;
    return;
  }
  
  try {
    await projectService.updateProject(project.id, { status: newStatus } as any);
    project.status = newStatus as any;
    toast.success(`Đã chuyển trạng thái sang ${getStatusLabel(newStatus)}`);
  } catch (error: any) {
    toast.error(error.message || 'Không thể cập nhật trạng thái');
  } finally {
    activeStatusMenu.value = null;
  }
};

const getAvailableStatuses = (currentStatus: string) => {
  const currentRank = STATUS_RANK[currentStatus] || 0;
  if (currentStatus === 'COMPLETED') return ['COMPLETED'];
  return Object.keys(STATUS_RANK).filter(s => STATUS_RANK[s] >= currentRank);
};

const formData = ref({
  id: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  scale: 'MEDIUM' as ('SMALL' | 'MEDIUM' | 'LARGE'),
  complexity: 'MEDIUM' as ('LOW' | 'MEDIUM' | 'HIGH'),
  category: 'Phần mềm',
  budget: 0,
  clientName: '',
  status: 'PENDING' as ('PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'),
  managerId: localStorage.getItem('userId') || '',
  memberIds: [] as string[],
  progress: 0,
  ai_classification: '',
  ai_risk_score: 0,
});

const getBadgeType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'success',
    'DELAYED': 'danger'
  };
  return types[status?.toUpperCase()] || 'secondary';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ bắt đầu',
    'IN_PROGRESS': 'Đang thực hiện',
    'COMPLETED': 'Hoàn thành',
    'DELAYED': 'Trễ hạn'
  };
  return labels[status?.toUpperCase()] || status;
};

const getScaleLabel = (scale: string) => {
  const labels: Record<string, string> = {
    'SMALL': 'Nhỏ',
    'MEDIUM': 'Trung bình',
    'LARGE': 'Lớn'
  };
  return labels[scale?.toUpperCase()] || scale;
};

const getRiskClass = (score: number) => {
  if (score > 70) return 'risk-high';
  if (score > 30) return 'risk-medium';
  return 'risk-low';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const editProject = (project: Project) => {
  isEditing.value = true;
  currentProjectOriginStatus.value = project.status;
  formData.value = { 
    ...project,
    startDate: project.startDate ? project.startDate.split('T')[0] : '',
    endDate: project.endDate ? project.endDate.split('T')[0] : '',
    memberIds: project.members ? project.members.map(m => typeof m === 'string' ? m : m.id) : []
  } as any;
  showCreateModal.value = true;
};

const handleSaveProject = async () => {
  savingProject.value = true;
  classificationMessage.value = 'AI đang xử lý...';

  try {
    // Tự động tính toán số ngày dự kiến
    const start = new Date(formData.value.startDate).getTime();
    const end = new Date(formData.value.endDate).getTime();
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 0;

    const classifyPayload = {
      ...formData.value,
      estimatedDurationDays: durationDays,
      teamSize: formData.value.memberIds.length
    };

    const { classification, riskScore, complexity } = await projectService.classifyProject(classifyPayload);
    
    formData.value.ai_classification = classification;
    formData.value.ai_risk_score = riskScore;
    formData.value.complexity = complexity as any;
    // Cập nhật scale tự động vào formData để gửi lên backend lưu trữ
    if (durationDays >= 180) formData.value.scale = 'LARGE';
    else if (durationDays >= 90) formData.value.scale = 'MEDIUM';
    else formData.value.scale = 'SMALL';

    classificationMessage.value = `Hoàn tất! Phân loại: ${classification}. Độ phức tạp: ${complexity === 'HIGH' ? 'Cao' : complexity === 'MEDIUM' ? 'Trung bình' : 'Thấp'}`;

    if (isEditing.value && formData.value.id) {
       await projectService.updateProject(formData.value.id, formData.value);
       const index = projects.value.findIndex(p => p.id === formData.value.id);
       if (index !== -1) projects.value[index] = { ...projects.value[index], ...formData.value } as Project;
    } else {
      const newProject = await projectService.createProject({
        ...formData.value,
        managerId: localStorage.getItem('userId') || '',
        members: formData.value.memberIds as any,
      });
      projects.value.push(newProject);
    }

    toast.success(isEditing.value ? 'Đã cập nhật dự án' : 'Đã tạo dự án & phân loại AI');
    fetchProjects(); // Tải lại trang hiện tại
    setTimeout(() => closeModal(), 1200);
  } catch (error: any) {
    toast.error(error.message || 'Lỗi hệ thống');
  } finally {
    savingProject.value = false;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  isEditing.value = false;
  classificationMessage.value = '';
  formData.value = {
    id: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    scale: 'MEDIUM',
    complexity: 'MEDIUM',
    category: 'Phần mềm',
    budget: 0,
    clientName: '',
    status: 'PENDING',
    managerId: localStorage.getItem('userId') || '',
    memberIds: [],
    progress: 0,
    ai_classification: '',
    ai_risk_score: 0,
  };
};

const openProgressModal = (project: Project) => {
  progressData.value = {
    projectId: project.id,
    progress: project.progress,
    description: ''
  };
  showProgressModal.value = true;
};

const closeProgressModal = () => {
  showProgressModal.value = false;
  progressData.value = { projectId: '', progress: 0, description: '' };
};

const handleUpdateProgress = async () => {
  try {
    savingProgress.value = true;
    const updated = await projectService.updateProjectProgress(
      progressData.value.projectId,
      progressData.value.progress,
      progressData.value.description
    );
    const index = projects.value.findIndex(p => p.id === updated.id);
    if (index !== -1) projects.value[index] = updated;
    toast.success('Đã lưu tiến độ dự án');
    closeProgressModal();
  } catch (error: any) {
    toast.error(error.message || 'Lỗi hệ thống');
  } finally {
    savingProgress.value = false;
  }
};

const viewProgressLogs = (project: Project) => {
  selectedProjectLogs.value = project.progressLogs ? [...project.progressLogs].reverse() : [];
  showLogModal.value = true;
};

const closeLogModal = () => {
  showLogModal.value = false;
  selectedProjectLogs.value = [];
};

const getLogUserName = (userId: string | any) => {
  const id = typeof userId === 'object' ? userId.id || userId._id : userId;
  return getUserName(id);
};

onMounted(async () => {
  userRole.value = localStorage.getItem('userRole') || '';
  // Directive click-outside đơn giản
  (window as any).vClickOutside = {
    mounted(el: any, binding: any) {
      el.clickOutsideEvent = (event: any) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event);
        }
      };
      document.body.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el: any) {
      document.body.removeEventListener('click', el.clickOutsideEvent);
    },
  };

  try {
    const [_, usersData] = await Promise.all([
      fetchProjects(),
      userService.getUsers()
    ]);
    allUsers.value = usersData;
  } catch (error: any) {
    toast.error(error.message || 'Không tải được dữ liệu');
  }
});
</script>

<style scoped>
.projects-container {
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

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
}
.toolbar select { max-width: 240px; }
.search-box {
  flex: 1;
  position: relative;
}
.search-box input { padding-left: 38px; }
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.project-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
}

.card-header-row {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-content {
  padding: 0 20px 20px;
  flex: 1;
}

.project-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-main);
}

.description {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
  height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.meta-item .value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.ai-insight-box {
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.insight-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.insight-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.classification-tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
}

.risk-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.risk-high { background: #FEE2E2; color: #EF4444; }
.risk-medium { background: #FEF3C7; color: #F59E0B; }
.risk-low { background: #DCFCE7; color: #10B981; }

.progress-section {
  margin-top: auto;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-muted);
}

.progress-track {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
}

/* Pagination Modern Mini Styles (As Photo) */
.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-numbers {
  display: flex;
  gap: 6px;
}

.page-nav-btn, .page-num-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: #2563EB;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.page-nav-btn:hover:not(:disabled), .page-num-btn:hover:not(.active) {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.page-num-btn.active {
  background: #2563EB;
  color: white;
  border-color: #2563EB;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #94A3B8;
}

.pagination-dots {
  color: #94A3B8;
  width: 20px;
  text-align: center;
  font-weight: 600;
}

.card-footer {
  padding: 16px 20px;
  background: var(--bg-main);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.task-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-main);
}

.date-range {
  color: var(--text-muted);
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
}

.project-form {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-main);
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.classification-preview {
  background: #F0F9FF;
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 24px;
  border-left: 4px solid var(--secondary);
}

.ai-loader {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--secondary);
  font-weight: 600;
}

.classification-result {
  font-size: 13px;
  color: #0369A1;
  font-weight: 600;
  margin: 0;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}

.btn-ghost:hover {
  background: var(--accent);
  color: var(--text-main);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(14, 165, 233, 0.3);
  border-top-color: var(--secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.member-selection-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.members-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: #F8FAFC;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
}

.member-chip {
  background: white;
  color: var(--text-main);
  padding: 4px 10px 4px 6px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-xs);
}

.chip-avatar {
  width: 20px;
  height: 20px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.remove-chip {
  cursor: pointer;
  font-size: 16px;
  color: var(--text-soft);
  transition: color 0.2s;
  margin-left: 4px;
}

.remove-chip:hover {
  color: var(--danger);
}

/* Pagination Modern Mini Styles (As Photo) */
.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-numbers {
  display: flex;
  gap: 6px;
}

.page-nav-btn, .page-num-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  color: #2563EB;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.page-nav-btn:hover:not(:disabled), .page-num-btn:hover:not(.active) {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.page-num-btn.active {
  background: #2563EB;
  color: white;
  border-color: #2563EB;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #94A3B8;
}

.pagination-dots {
  color: #94A3B8;
  width: 20px;
  text-align: center;
  font-weight: 600;
}

/* Status Quick Change Styles */
.status-dropdown {
  position: relative;
}

.status-badge {
  cursor: pointer;
  display: flex !important;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  user-select: none;
  transition: transform 0.2s;
  border: 1px solid transparent;
}

.status-badge:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.chevron-down {
  font-size: 10px;
  opacity: 0.7;
}

.status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #E2E8F0;
  z-index: 100;
  min-width: 160px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-option {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}

.status-option:hover {
  background: #F8FAFC;
  color: #2563EB;
}

.status-option.active {
  background: #EFF6FF;
  color: #2563EB;
}

.status-option.active::after {
  content: '✓';
  float: right;
  font-size: 12px;
}

/* Progress Logs Styles */
.logs-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.log-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 2px solid #E2E8F0;
  margin-left: 8px;
  padding-left: 16px;
}

.log-item {
  position: relative;
  background: #F8FAFC;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}

.log-item::before {
  content: '';
  position: absolute;
  left: -21px;
  top: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid white;
}

.log-header {
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--text-main);
}

.log-desc {
  font-size: 13px;
  color: var(--text-muted);
  white-space: pre-line;
  margin-bottom: 8px;
}

.log-date {
  font-size: 11px;
  color: #94A3B8;
}
</style>
