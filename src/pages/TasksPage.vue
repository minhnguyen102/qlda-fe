<template>
  <div class="tasks-container">
    <header class="page-header">
      <div>
        <h1>Quản Lý Công Việc</h1>
        <p class="subtitle">Theo dõi và cập nhật tiến độ nhiệm vụ</p>
      </div>
      <button v-if="permissions.canCreateTask" @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">+</span> Thêm Công Việc
      </button>
    </header>

    <div class="card filter-bar">
      <div class="filter-group">
        <label>Dự án</label>
        <select v-model="filterProject" class="form-control">
          <option value="">Tất cả dự án</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Trạng thái</label>
        <select v-model="filterStatus" class="form-control">
          <option value="">Tất cả</option>
          <option value="TODO">Chưa thực hiện</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="REVIEW">Đang duyệt</option>
          <option value="DONE">Hoàn thành</option>
        </select>
      </div>
    </div>

    <div class="card table-container">
      <table class="modern-table">
        <thead>
          <tr>
            <th style="width: 45%; font-size: 0.8rem;">Tên Việc</th>
            <th style="font-size: 0.8rem;">Dự Án</th>
            <th style="font-size: 0.8rem;">Người Làm</th>
            <th style="font-size: 0.8rem; white-space: nowrap;">Hạn Định</th>
            <th style="font-size: 0.8rem;">Trạng Thái</th>
            <th style="font-size: 0.8rem;">Tiến Độ</th>
            <th class="text-right" style="font-size: 0.8rem;">Lệnh</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td class="task-title-cell">
              <div class="task-title-wrapper">
                <span class="priority-dot" :class="'priority-' + task.priority.toLowerCase()"></span>
                {{ task.title }}
              </div>
            </td>
            <td>
              <span class="project-tag">{{ getProjectName(task.projectId) }}</span>
            </td>
            <td>
              <div class="assignee-box">
                <span class="avatar-sm">{{ task.assignee?.fullName?.charAt(0) }}</span>
                <span>{{ task.assignee?.fullName }}</span>
              </div>
            </td>
            <td :class="{ 'text-danger': isOverdue(task.dueDate) && task.status !== 'DONE' }">
              {{ formatDate(task.dueDate) }}
            </td>
            <td>
              <span class="badge" :class="'badge-' + getBadgeType(task.status)">
                {{ getStatusLabel(task.status) }}
              </span>
            </td>
            <td>
              <div class="progress-wrapper">
                <div class="progress-label">{{ task.progress }}%</div>
                <div class="progress-track-sm">
                  <div v-if="task.progress > 0" class="progress-fill-sm" :style="{ width: task.progress + '%' }"></div>
                </div>
              </div>
            </td>
            <td class="text-right">
              <div class="action-buttons">
                <!-- Nút xem lịch sử (tất cả mọi người) -->
                <button @click="viewProgressLogs(task)" class="btn-icon" title="Lịch sử cập nhật">🕒</button>
                <button v-if="permissions.canEditTask" @click="editTask(task)" class="btn-icon">✏️</button>
                <button v-if="permissions.canDeleteTask" @click="deleteTask(task.id)" class="btn-icon">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="tasks.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No tasks found matching your criteria</p>
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
          <h2>{{ isEditing ? 'Cập Nhật Công Việc' : 'Tạo Công Việc Mới' }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </header>

        <form @submit.prevent="handleSaveTask" class="modal-form">
          <template v-if="userRole === 'MEMBER'">
            <div class="task-info-readonly" style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: var(--text-main);">{{ formData.title }}</h3>
              <p style="margin: 0; color: var(--text-soft); font-size: 13px;">{{ formData.description }}</p>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Tiến độ ({{ formData.progress }}%)</label>
                <input v-model.number="formData.progress" type="range" min="0" max="100" class="range-input" />
              </div>
              <div class="form-group">
                <label>Trạng thái</label>
                <select v-model="formData.status" required>
                  <option value="TODO">Chưa làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="REVIEW">Chờ duyệt</option>
                  <option value="DONE">Hoàn thành</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Hôm nay bạn đã làm được gì? *</label>
              <textarea v-model="progressLogDescription" placeholder="Mô tả tiến độ của bạn..." required style="min-height: 80px;"></textarea>
            </div>
          </template>

          <template v-else>
            <div class="form-group">
              <label>Tên Công Việc *</label>
              <input v-model="formData.title" type="text" placeholder="Công việc cần thực hiện?" required />
            </div>

            <div class="form-group">
              <label>Chi Tiết Công Việc</label>
              <textarea v-model="formData.description" placeholder="Mô tả chi tiết công việc..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Dự án liên kết</label>
                <select v-model="formData.projectId" required>
                  <option value="" disabled>-- Chọn dự án --</option>
                  <option v-for="project in projects" :key="project.id" :value="project.id">
                    {{ project.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Người thực hiện</label>
                <select v-model="formData.assigneeId" required :disabled="!formData.projectId">
                  <option value="" disabled>
                    {{ formData.projectId ? '-- Chọn thành viên --' : '-- Vui lòng chọn dự án trước --' }}
                  </option>
                  <option v-for="user in availableAssignees" :key="user.id" :value="user.id">
                    {{ user.fullName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Hạn hoàn thành</label>
                <input v-model="formData.dueDate" type="date" required />
              </div>
              <div class="form-group">
                <label>Độ ưu tiên</label>
                <select v-model="formData.priority">
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Trạng thái</label>
                <select v-model="formData.status" required>
                  <option value="TODO">Chưa làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="REVIEW">Chờ duyệt</option>
                  <option value="DONE">Hoàn thành</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tiến độ ({{ formData.progress }}%)</label>
                <input v-model.number="formData.progress" type="range" min="0" max="100" class="range-input" />
              </div>
            </div>
          </template>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-ghost">Đóng</button>
            <button type="submit" class="btn btn-primary" :disabled="savingTask">
              {{ isEditing ? 'Cập Nhật Công Việc' : 'Tạo Công Việc' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Progress Log History Modal -->
    <div v-if="showLogModal" class="modal-overlay">
      <div class="card modal-content" style="max-width: 600px;">
        <header class="modal-header">
          <h2>Task Progress Update History</h2>
          <button @click="closeLogModal" class="btn-close">×</button>
        </header>
        <div class="logs-container">
          <div v-if="!selectedTaskLogs || selectedTaskLogs.length === 0" class="empty-state">
            <p>No update history yet.</p>
          </div>
          <div v-else class="log-timeline">
            <div v-for="(log, idx) in selectedTaskLogs" :key="idx" class="log-item">
              <div class="log-header">
                <strong>{{ getLogUserName(log.userId) }}</strong> đã cập nhật tiến độ thành <strong style="color:var(--primary)">{{ log.progress }}%</strong>
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
import type { Task, Project, User, ProgressLog } from '@/types';
import { taskService, projectService, userService } from '@/services/mockApiService';
import { getRolePermissions } from '@/utils/roleUtils';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const tasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const members = ref<User[]>([]);
const selectedTask = ref<Task | null>(null);
const showCreateModal = ref(false);
const isEditing = ref(false);
const savingTask = ref(false);
const filterStatus = ref('');
const filterProject = ref('');
const userRole = ref<string>('');

// Pagination state
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const pageSize = 10;

const paginationStart = computed(() => totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize + 1);
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, totalItems.value));

const permissions = computed(() => {
  return getRolePermissions(userRole.value as any) || {}
});

const formData = ref({
  projectId: '',
  assigneeId: '',
  title: '',
  description: '',
  status: 'TODO' as ('TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'),
  dueDate: '',
  progress: 0,
  priority: 'MEDIUM' as ('LOW' | 'MEDIUM' | 'HIGH'),
});

const progressLogDescription = ref('');
const showLogModal = ref(false);
const selectedTaskLogs = ref<ProgressLog[]>([]);

const filteredTasks = computed(() => {
  // Vì chúng ta dùng backend pagination, data trong tasks.value đã là data được filter
  return tasks.value;
});

const availableAssignees = computed(() => {
  if (!formData.value.projectId) return [];
  const project = projects.value.find(p => p.id === formData.value.projectId);
  if (!project) return [];

  // Gom quản lý và tất cả thành viên trong dự án lại
  const projectUsers: User[] = [];
  if (project.manager) projectUsers.push(project.manager);
  if (project.members && project.members.length > 0) {
    project.members.forEach((m: any) => {
      // Tránh duplicate nếu manager cũng nằm trong list member
      if (!projectUsers.find(u => u.id === m.id)) {
        projectUsers.push(m);
      }
    });
  }

  // Nếu API không đủ data trong `project.members` vì nó chỉ có ID (trường hợp fallback)
  // Thực hiện map qua mảng `members` global chứa toàn bộ users
  const assignees = projectUsers.map(u => {
    // Nếu u chưa có fullName (do backend không populate), lấy từ danh sách members toàn cục
    if (!u.fullName) {
      return members.value.find(m => m.id === u.id) || u;
    }
    return u;
  });

  return assignees;
});

watch(() => formData.value.projectId, (newProjectId, oldProjectId) => {
  // Chỉ reset user khi ko phải lúc popup mới vừa mở (oldProjectId đã có value rồi mới tính là 'đổi')
  if (oldProjectId && newProjectId !== oldProjectId && formData.value.assigneeId) {
    const isAssigneeStillValid = availableAssignees.value.some(u => u.id === formData.value.assigneeId);
    if (!isAssigneeStillValid) {
      formData.value.assigneeId = '';
    }
  }
});

const getProjectName = (projectId: string) => {
  return projects.value.find(p => p.id === projectId)?.name || 'Dự án khác';
};

const getBadgeType = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'DONE' || s === 'COMPLETED') return 'success';
  if (s === 'REVIEW') return 'info';
  if (s === 'IN_PROGRESS') return 'warning';
  return 'info';
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    TODO: 'Chưa làm',
    IN_PROGRESS: 'Đang làm',
    REVIEW: 'Chờ duyệt',
    DONE: 'Hoàn thành'
  };
  return map[status?.toUpperCase()] || status;
};

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('vi-VN');
};

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date();
};

const viewProgressLogs = (task: Task) => {
  selectedTaskLogs.value = task.progressLogs ? [...task.progressLogs].reverse() : [];
  showLogModal.value = true;
};

const closeLogModal = () => {
  showLogModal.value = false;
  selectedTaskLogs.value = [];
};

const getLogUserName = (userId: string | any) => {
  if (!userId) return 'Unknown';
  const id = typeof userId === 'object' ? userId.id || userId._id : userId;
  return members.value.find(m => m.id === id)?.fullName || 'Người dùng ẩn';
};

const editTask = (task: Task) => {
  isEditing.value = true;
  formData.value = { ...task, description: task.description || '' };
  progressLogDescription.value = '';
  selectedTask.value = task;
  showCreateModal.value = true;
};

const handleSaveTask = async () => {
  try {
    savingTask.value = true;
    
    // Nếu là nhân viên, chỉ cập nhật tiến độ thông qua API chuyên biệt
    if (isEditing.value && selectedTask.value && userRole.value === 'MEMBER') {
      const updatedTask = await taskService.updateTaskProgress(
        selectedTask.value.id,
        formData.value.progress,
        progressLogDescription.value
      );

      const index = tasks.value.findIndex(t => t.id === updatedTask.id);
      if (index !== -1) tasks.value[index] = updatedTask;

      toast.success('Đã cập nhật tiến độ công việc');

      // Hiển thị đánh giá AI ngay sau khi nhân viên cập nhật
      const ai = updatedTask.aiAssessment;
      if (ai) {
        const msg = `🤖 ${ai.headline}: ${ai.recommendation}`;
        const title = `AI đánh giá dự án · Tiến độ ${ai.computedProgress}% / Kỳ vọng ${ai.expectedProgress}%`;
        if (ai.severity === 'HIGH') toast.error(msg, title);
        else if (ai.severity === 'MEDIUM') toast.warning(msg, title);
        else toast.success(msg, title);
      }
    } else {
      // Logic lưu công việc bình thường của Quản lý / Admin
      let res;
      if (isEditing.value && selectedTask.value) {
        res = await taskService.updateTask(selectedTask.value.id, formData.value as any);
        const index = tasks.value.findIndex(t => t.id === res.id);
        if (index !== -1) tasks.value[index] = res;
      } else {
        const payload: any = { ...formData.value };
        if (!payload.assigneeId) delete payload.assigneeId;
        res = await taskService.createTask(payload);
      }
      toast.success(isEditing.value ? 'Đã lưu công việc' : 'Đã tạo công việc mới');
    }

    fetchTasks();
    closeModal();
  } catch (error: any) {
    toast.error(error.message || 'Lỗi hệ thống');
  } finally {
    savingTask.value = false;
  }
};

const deleteTask = async (id: string) => {
  if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
  try {
    await taskService.deleteTask(id);
    fetchTasks();
    toast.success('Đã xoá công việc');
  } catch (e: any) {
    toast.error(e.message || 'Không xoá được công việc');
  }
};

const fetchTasks = async () => {
  try {
    const response = await taskService.getTasks(
      currentPage.value, 
      pageSize, 
      filterProject.value, 
      filterStatus.value
    );
    tasks.value = response.data;
    totalPages.value = response.pagination.pages;
    totalItems.value = response.pagination.total;
  } catch (error: any) {
    toast.error(error.message || 'Không tải được danh sách công việc');
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchTasks();
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

import { watch } from 'vue';
watch([filterProject, filterStatus], () => {
  currentPage.value = 1;
  fetchTasks();
});

const closeModal = () => {
  showCreateModal.value = false;
  isEditing.value = false;
  selectedTask.value = null;
  formData.value = {
    projectId: '',
    assigneeId: '',
    title: '',
    description: '',
    status: 'TODO',
    dueDate: '',
    progress: 0,
    priority: 'MEDIUM',
  };
};

onMounted(async () => {
  userRole.value = localStorage.getItem('userRole') || '';
  try {
    const [_, projectsList, membersList] = await Promise.all([
      fetchTasks(),
      projectService.getProjects(1, 100), // Lấy hết dự án cho filter
      userService.getUsers(),
    ]);
    projects.value = projectsList.data;
    members.value = membersList.filter(m => m.role === 'MEMBER' || m.role === 'PROJECT_MANAGER');
  } catch (error: any) {
    toast.error(error.message || 'Không tải được dữ liệu');
  }
});
</script>

<style scoped>
.tasks-container {
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

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 24px;
  padding: 20px 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
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
  color: var(--text-main);
  outline: none;
}

.form-control:focus {
  border-color: var(--primary);
}

/* Table */
.table-container {
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  padding: 16px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-main);
  border-bottom: 1px solid var(--border);
}

.modern-table td {
  padding: 12px 24px;
  font-size: 13px;
  color: var(--text-main);
  border-bottom: 1px solid var(--border);
}

.modern-table tr:last-child td {
  border-bottom: none;
}

.modern-table tr:hover {
  background: #F8FAFC;
}

.modern-table tr td {
  transition: all 0.2s ease;
}

.task-title-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.task-title-cell {
  font-weight: 500;
  line-height: 1.4;
}
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.priority-high { background: var(--danger); box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
.priority-medium { background: var(--warning); box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
.priority-low { background: var(--success); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
.project-tag {
  background: #EEF2FF;
  color: #4338CA;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.assignee-box {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.avatar-sm {
  width: 24px;
  height: 24px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
}

.progress-wrapper {
  min-width: 120px;
}

.progress-label {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.progress-track-sm {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-sm {
  height: 100%;
  background: var(--primary);
}

.text-right { text-align: right; }
.text-danger { color: var(--danger); font-weight: 600; }

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;
}

.btn-icon:hover {
  opacity: 1;
  background: var(--accent);
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  padding: 0;
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

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
}

.form-group textarea {
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.range-input {
  height: 6px;
  padding: 0 !important;
  accent-color: var(--primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .modern-table {
    display: block;
    overflow-x: auto;
  }
}

/* Pagination Modern Mini Styles (As Photo) */
.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-bottom: 32px;
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
  width: 18px;
  text-align: center;
  font-weight: 600;
}
.task-info-readonly {
  background: var(--bg-main);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
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
  font-size: 15px;
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
}
</style>
