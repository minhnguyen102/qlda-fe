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
      <router-link to="/projects" style="font-size: 0.9em;">← Danh sách dự án</router-link>
    </div>

    <!-- Completed Hero Banner -->
    <div v-if="project.status === 'COMPLETED'" class="completed-hero">
      <div class="completed-hero-icon">✔</div>
      <div class="completed-hero-text">
        <h2 style="font-size: 1.2rem; white-space: nowrap;">Dự án hoàn thành!</h2>
        <p style="font-size: 0.8rem;">Ngày: {{ formatDate(project.endDate) }} &nbsp;·&nbsp; {{ tasks.length }} việc</p>
      </div>
      <div class="completed-hero-badge">100% ✓</div>
    </div>

    <header class="detail-header card" :class="{ 'detail-header--completed': project.status === 'COMPLETED' }">
      <div class="header-main">
        <div class="title-row">
          <h1>{{ project.name }}</h1>
          <span class="badge" :class="'badge-' + badgeOf(project.status)">
            {{ getStatusLabel(project.status) }}
          </span>
        </div>
        <p class="description">{{ project.description || 'Chưa có mô tả' }}</p>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem;">Quản lý</span>
            <span class="m-value" style="font-size: 0.85rem;">{{ project.manager?.fullName || 'N/A' }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem;">Thành viên</span>
            <span class="m-value" style="font-size: 0.85rem;">{{ project.members?.length || 0 }} người</span>
          </div>
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem;">Quy mô</span>
            <span class="m-value" style="font-size: 0.85rem;">{{ getScaleLabel(project.scale) }} · {{ getComplexityLabel(project.complexity) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem;">Ngân sách</span>
            <span class="m-value" style="font-size: 0.85rem;">{{ formatCurrency(project.budget) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem;">Bắt đầu</span>
            <span class="m-value" style="font-size: 0.85rem;">{{ formatDate(project.startDate) }}</span>
          </div>
          <div class="meta-item">
            <span class="m-label" style="font-size: 0.8rem; white-space: nowrap;">{{ project.status === 'COMPLETED' ? 'Hoàn thành' : 'Hạn cuối' }}</span>
            <span class="m-value" :class="{ 'completed-date-value': project.status === 'COMPLETED' }" style="font-size: 0.85rem;">
              {{ formatDate(project.endDate) }}
            </span>
          </div>
        </div>
      </div>

      <div class="header-side">
        <div class="ai-chip" :class="{ 'ai-chip--completed': project.status === 'COMPLETED' }">
          <span class="chip-label" style="font-size: 0.75rem;">Phân loại</span>
          <span class="chip-value" style="font-size: 0.8rem;">{{ project.ai_classification || '—' }}</span>
        </div>

        <!-- Ring Progress -->
        <div class="ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              :stroke="project.status === 'COMPLETED' ? '#22c55e' : progressColor"
              stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="project.status === 'COMPLETED' ? '314 314' : `${(project.progress || 0) * 3.14} 314`"
              transform="rotate(-90 60 60)"
              style="transition: stroke-dasharray 0.8s ease;"
            />
            <!-- Checkmark icon cho completed -->
            <text v-if="project.status !== 'COMPLETED'"
                  x="60" y="62" text-anchor="middle" dominant-baseline="middle"
                  style="font-size: 22px; font-weight: 800; fill: var(--text-main);">
              {{ project.progress || 0 }}%
            </text>
            <text v-else
                  x="60" y="56" text-anchor="middle" dominant-baseline="middle"
                  style="font-size: 26px; font-weight: 900; fill: #16a34a;">
              ✔
            </text>
            <text v-if="project.status === 'COMPLETED'"
                  x="60" y="76" text-anchor="middle" dominant-baseline="middle"
                  style="font-size: 13px; font-weight: 800; fill: #16a34a;">
              100%
            </text>
          </svg>
          <p class="ring-label" :class="{ 'ring-label--done': project.status === 'COMPLETED' }" style="font-size: 0.8rem;">
            {{ project.status === 'COMPLETED' ? 'Hoàn thành' : 'Tiến độ' }}
          </p>
        </div>

        <!-- Ẩn nút dự đoán khi đã hoàn thành -->
        <button
          v-if="project.status !== 'COMPLETED'"
          class="btn btn-primary btn-block" :disabled="predicting" @click="runPrediction"
        >
          <span style="font-size: 0.8rem; white-space: nowrap;">{{ predicting ? 'Phân tích...' : '🤖 Dự đoán' }}</span>
        </button>

        <!-- Nút xem tổng kết khi hoàn thành -->
        <button
          v-else
          class="btn btn-success btn-block" @click="tab = 'summary'"
        >
          <span style="font-size: 0.9em; white-space: nowrap;">🏆 Xem Tổng Kết</span>
        </button>
      </div>
    </header>

    <!-- AI Auto Assessment Banner -->
    <div
      v-if="latestAssessment && project.status !== 'COMPLETED'"
      class="ai-auto-banner"
      :class="'ai-auto-banner--' + latestAssessment.severity.toLowerCase()"
    >
      <div class="ai-auto-icon">🤖</div>
      <div class="ai-auto-body">
        <div class="ai-auto-head">
          <span class="ai-auto-title">{{ latestAssessment.headline }}</span>
          <div class="ai-auto-head-right">
            <span class="ai-auto-time">{{ formatDateTime(latestAssessment.date) }}</span>
            <button
              v-if="assessmentHistory.length > 0"
              class="ai-history-btn"
              @click="showAiHistoryModal = true"
              title="Xem lịch sử đánh giá"
            >
              🕒 Lịch sử ({{ assessmentHistory.length }})
            </button>
          </div>
        </div>
        <p class="ai-auto-summary">{{ latestAssessment.summary }}</p>
        <div class="ai-auto-metrics">
          <div class="ai-metric">
            <span class="ai-metric-label">Tiến độ thực tế</span>
            <span class="ai-metric-value">{{ latestAssessment.computedProgress }}%</span>
          </div>
          <div class="ai-metric">
            <span class="ai-metric-label">Kỳ vọng</span>
            <span class="ai-metric-value">{{ latestAssessment.expectedProgress }}%</span>
          </div>
          <div class="ai-metric">
            <span class="ai-metric-label">Rủi ro</span>
            <span class="ai-metric-value" :class="riskClass(latestAssessment.riskScore)">{{ latestAssessment.riskScore }}</span>
          </div>
          <div class="ai-metric" v-if="latestAssessment.predictedDelayDays > 0">
            <span class="ai-metric-label">Dự kiến trễ</span>
            <span class="ai-metric-value text-danger">{{ latestAssessment.predictedDelayDays }} ngày</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreateTaskModal" class="modal-overlay" @click.self="closeCreateTaskModal">
      <div class="card modal-content create-task-modal">
        <header class="modal-header">
          <h2>📝 Tạo công việc mới</h2>
          <button @click="closeCreateTaskModal" class="btn-close">×</button>
        </header>
        <form @submit.prevent="handleCreateTask" class="ct-form">
          <div class="form-group">
            <label>Tên công việc *</label>
            <input v-model="taskForm.title" type="text" placeholder="Ví dụ: Thiết kế API đăng nhập" required />
          </div>

          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="taskForm.description" placeholder="Mô tả chi tiết..." rows="2"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Người thực hiện *</label>
              <select v-model="taskForm.assigneeId" required>
                <option value="" disabled>-- Chọn --</option>
                <option v-for="u in assigneeOptions" :key="u.id" :value="u.id">{{ u.fullName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Độ ưu tiên</label>
              <select v-model="taskForm.priority">
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ngày bắt đầu</label>
              <input v-model="taskForm.startDate" type="date" />
            </div>
            <div class="form-group">
              <label>Hạn hoàn thành *</label>
              <input v-model="taskForm.dueDate" type="date" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="taskForm.status">
                <option value="TODO">Chưa làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="REVIEW">Chờ duyệt</option>
              </select>
            </div>
            <div class="form-group">
              <label>Số giờ ước tính</label>
              <input v-model.number="taskForm.estimatedHours" type="number" min="0" step="0.5" placeholder="0" />
            </div>
          </div>

          <!-- Subtasks section -->
          <div class="subtasks-section">
            <div class="subtasks-head">
              <label>Danh sách subtask ({{ taskForm.subtasks.length }})</label>
              <span class="subtasks-hint">Chia nhỏ công việc để dễ theo dõi</span>
            </div>

            <div v-if="taskForm.subtasks.length" class="subtasks-list">
              <div v-for="(s, idx) in taskForm.subtasks" :key="idx" class="subtask-row">
                <span class="sub-num">{{ idx + 1 }}</span>
                <input v-model="s.title" type="text" class="sub-title-input" />
                <button type="button" class="sub-remove" @click="removeSubtask(idx)" title="Xoá">×</button>
              </div>
            </div>

            <div class="subtask-add">
              <input
                v-model="newSubtaskTitle"
                type="text"
                placeholder="Thêm subtask (VD: Viết docstring)..."
                @keydown.enter.prevent="addSubtask"
              />
              <button type="button" class="btn btn-outline btn-sm" @click="addSubtask">+ Thêm</button>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" @click="closeCreateTaskModal" class="btn btn-ghost">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="savingTask">
              {{ savingTask ? 'Đang tạo...' : 'Tạo công việc' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- AI Assessment History Modal -->
    <div v-if="showAiHistoryModal" class="modal-overlay" @click.self="showAiHistoryModal = false">
      <div class="card modal-content ai-history-modal">
        <header class="modal-header">
          <h2>🤖 Lịch sử đánh giá AI</h2>
          <button @click="showAiHistoryModal = false" class="btn-close">×</button>
        </header>
        <div class="ai-history-body">
          <div v-if="!assessmentHistory.length" class="empty-inline">Chưa có đánh giá AI nào.</div>
          <div v-else class="ai-history-timeline">
            <div
              v-for="(a, idx) in assessmentHistory"
              :key="idx"
              class="ai-history-item"
              :class="'ai-history-item--' + a.severity.toLowerCase()"
            >
              <div class="ai-history-dot" :class="'dot-' + a.severity.toLowerCase()"></div>
              <div class="ai-history-content">
                <div class="ai-history-head">
                  <span class="ai-history-headline">{{ a.headline }}</span>
                  <span class="ai-history-time">{{ formatDateTime(a.date) }}</span>
                </div>
                <p class="ai-history-summary">{{ a.summary }}</p>
                <div class="ai-history-meta">
                  <span class="chip chip-progress">Tiến độ {{ a.computedProgress }}%</span>
                  <span class="chip chip-expected">Kỳ vọng {{ a.expectedProgress }}%</span>
                  <span class="chip" :class="'chip-risk-' + a.severity.toLowerCase()">Rủi ro {{ a.riskScore }}</span>
                  <span v-if="a.predictedDelayDays > 0" class="chip chip-delay">Trễ {{ a.predictedDelayDays }} ngày</span>
                  <span v-if="a.triggerType" class="chip chip-trigger">{{ triggerLabel(a.triggerType) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in computedTabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="tab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- TASKS TAB - Kanban Board -->
    <section v-if="tab === 'tasks'" class="kanban-section">
      <div class="section-head">
        <h3 style="font-size: 1rem;">Công việc ({{ tasks.length }})</h3>
        <button
          v-if="canCreateTask && project.status !== 'COMPLETED'"
          class="btn btn-primary btn-sm"
          @click="openCreateTaskModal"
        >
          <span style="font-size: 0.9em; white-space: nowrap;">+ Tạo công việc</span>
        </button>
        <!-- Summary stats cho completed project -->
        <div v-if="project.status === 'COMPLETED'" class="task-summary-pills">
          <span class="pill pill-done">✔ {{ doneTasks.length }} Hoàn thành</span>
          <span v-if="inProgressTasks.length" class="pill pill-warn">{{ inProgressTasks.length }} Còn lại</span>
        </div>
      </div>
      <div v-if="!tasks.length" class="card empty-inline">Không tìm thấy công việc nào trong dự án này</div>
      <div v-else class="kanban-board">
        <!-- Cột Khởi tạo -->
        <div class="kanban-col">
          <div class="kanban-col-header todo">
            <span class="col-dot todo"></span>
            <span class="col-title">Cần làm</span>
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
              <div v-if="subtaskStats(t)" class="kc-subtasks">
                <div class="kc-sub-header">
                  <span class="kc-sub-icon">☑</span>
                  <span class="kc-sub-count">{{ subtaskStats(t)!.done }}/{{ subtaskStats(t)!.total }}</span>
                  <div class="kc-sub-bar"><div class="kc-sub-bar-fill" :style="{ width: subtaskStats(t)!.percent + '%' }"></div></div>
                </div>
                <div class="kc-sub-list">
                  <label
                    v-for="(s, si) in t.subtasks"
                    :key="s._id || s.id || si"
                    class="kc-sub-item"
                    :class="{ 'kc-sub-done': s.done }"
                  >
                    <input type="checkbox" :checked="s.done" @change="toggleSubtaskDone(t, s)" />
                    <span>{{ s.title }}</span>
                  </label>
                </div>
              </div>
              <template v-if="getTaskAction(t.id)">
                <div v-if="(getTaskAction(t.id)!.severity) !== 'LOW'"
                     class="kc-ai"
                     :class="'kc-ai--' + getTaskAction(t.id)!.severity.toLowerCase()">
                  <span class="kc-ai-icon">{{ actionIcon(getTaskAction(t.id)!.action) }}</span>
                  <div class="kc-ai-body">
                    <span class="kc-ai-label">{{ getTaskAction(t.id)!.label }}</span>
                    <span class="kc-ai-sug">{{ getTaskAction(t.id)!.suggestion }}</span>
                  </div>
                </div>
              </template>
            </div>
            <div v-if="!todoTasks.length" class="kanban-empty">Trống</div>
          </div>
        </div>

        <!-- Cột Đang làm -->
        <div class="kanban-col">
          <div class="kanban-col-header inprogress">
            <span class="col-dot inprogress"></span>
            <span class="col-title">Đang làm</span>
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
              <!-- Added subtasks to In Progress column -->
              <div v-if="subtaskStats(t)" class="kc-subtasks">
                <div class="kc-sub-header">
                  <span class="kc-sub-icon">☑</span>
                  <span class="kc-sub-count">{{ subtaskStats(t)!.done }}/{{ subtaskStats(t)!.total }}</span>
                  <div class="kc-sub-bar"><div class="kc-sub-bar-fill" :style="{ width: subtaskStats(t)!.percent + '%' }"></div></div>
                </div>
                <div class="kc-sub-list">
                  <label
                    v-for="(s, si) in t.subtasks"
                    :key="s._id || s.id || si"
                    class="kc-sub-item"
                    :class="{ 'kc-sub-done': s.done }"
                  >
                    <input type="checkbox" :checked="s.done" @change="toggleSubtaskDone(t, s)" />
                    <span>{{ s.title }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div v-if="!inProgressTasks.length" class="kanban-empty">Trống</div>
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
              <div v-if="subtaskStats(t)" class="kc-subtasks-done-badge">
                ✅ {{ subtaskStats(t)!.total }} việc phụ đã xong
              </div>
            </div>
            <div v-if="!doneTasks.length" class="kanban-empty">Trống</div>
          </div>
        </div>
      </div>
    </section>

    <!-- PREDICTION TAB -->
    <section v-if="tab === 'prediction'" class="card">
      <div class="section-head">
        <h3>AI Dự đoán tiến độ</h3>
        <span class="muted">Phiên bản: {{ prediction?.modelVersion || 'chưa chạy' }}</span>
      </div>

      <div v-if="!prediction" class="empty-inline">
        Nhấn "🤖 Dự đoán" để AI phân tích. Hoặc
        <button class="btn btn-outline btn-sm" @click="runPrediction">Chạy ngay</button>
      </div>

      <div v-else class="prediction-grid">
        <div class="pred-card">
          <p class="pred-label">Hạn gốc</p>
          <p class="pred-value">{{ formatDate(prediction.originalEndDate) }}</p>
        </div>
        <div class="pred-card highlight">
          <p class="pred-label">Dự kiến xong</p>
          <p class="pred-value">{{ formatDate(prediction.predictedEndDate) }}</p>
          <span class="pred-delta" :class="prediction.predictedDelayDays > 0 ? 'bad' : 'good'">
            {{ prediction.predictedDelayDays > 0 ? `Trễ ${prediction.predictedDelayDays} ngày` : 'Đúng tiến độ' }}
          </span>
        </div>
        <div class="pred-card">
          <p class="pred-label">Tiến độ kỳ vọng</p>
          <p class="pred-value">{{ prediction.expectedProgress }}%</p>
        </div>
        <div class="pred-card">
          <p class="pred-label">Điểm rủi ro</p>
          <p class="pred-value" :class="riskClass(prediction.riskScore)">{{ prediction.riskScore }}</p>
        </div>
      </div>

      <div v-if="prediction" class="recommendation">
        <div class="rec-icon">🤖</div>
        <div>
          <p class="rec-title">Đề xuất từ AI</p>
          <p class="rec-text">{{ prediction.recommendation }}</p>
        </div>
      </div>

      <div v-if="prediction?.taskPredictions?.length" class="task-pred">
        <h4>Phân tích cấp độ công việc</h4>
        <div class="task-pred-list">
          <div v-for="tp in prediction.taskPredictions" :key="tp.id" class="tp-row" :class="{ 'at-risk': tp.atRisk }">
            <div class="tp-main">
              <span class="tp-title">{{ tp.title }}</span>
              <span class="muted">{{ tp.assignee?.fullName || '—' }}</span>
            </div>
            <div class="tp-meta">
              <span class="badge" :class="'badge-' + badgeOf(tp.status)">{{ tp.status }}</span>
              <span class="tp-days" :class="tp.daysRemaining < 0 ? 'text-danger' : ''">
                {{ tp.daysRemaining < 0 ? `Quá hạn ${-tp.daysRemaining} ngày` : `Còn lại ${tp.daysRemaining} ngày` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SUMMARY TAB (chỉ hiện khi COMPLETED) -->
    <section v-if="tab === 'summary'" class="card summary-section">
      <div class="section-head">
        <h3>🏆 Tổng kết dự án</h3>
      </div>

      <div class="summary-hero">
        <div class="summary-stat">
          <span class="ss-val ss-green">100%</span>
          <span class="ss-label">Tiến độ</span>
        </div>
        <div class="summary-stat">
          <span class="ss-val">{{ tasks.length }}</span>
          <span class="ss-label">Tổng việc</span>
        </div>
        <div class="summary-stat">
          <span class="ss-val ss-green">{{ doneTasks.length }}</span>
          <span class="ss-label">Đã xong</span>
        </div>
        <div class="summary-stat">
          <span class="ss-val">{{ project.members?.length || 0 }}</span>
          <span class="ss-label">Thân viên</span>
        </div>
      </div>

      <div class="summary-timeline">
        <div class="timeline-item">
          <span class="tl-dot tl-start"></span>
          <div>
            <p class="tl-label">Ngày bắt đầu</p>
            <p class="tl-val">{{ formatDate(project.startDate) }}</p>
          </div>
        </div>
        <div class="timeline-line"></div>
        <div class="timeline-item">
          <span class="tl-dot tl-end"></span>
          <div>
            <p class="tl-label">Ngày hoàn thành</p>
            <p class="tl-val completed-date-value">{{ formatDate(project.endDate) }}</p>
          </div>
        </div>
      </div>

      <div class="summary-ai-box">
        <div class="summary-ai-label">🤖 Kết quả phân loại AI</div>
        <div class="summary-ai-row">
          <div>
            <p class="tl-label">Danh mục</p>
            <p class="tl-val" style="color: var(--primary); font-weight: 700;">{{ project.ai_classification || '—' }}</p>
          </div>
          <div>
            <p class="tl-label">Ngân sách</p>
            <p class="tl-val">{{ formatCurrency(project.budget) }}</p>
          </div>
          <div>
            <p class="tl-label">Quy mô / Độ khó</p>
            <p class="tl-val">{{ getScaleLabel(project.scale) }} / {{ getComplexityLabel(project.complexity) }}</p>
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
            <div v-if="memberPerformance[m.id]" class="m-perf">
              <span class="m-perf-grade" :class="'m-perf--' + perfBadge(memberPerformance[m.id].score)">
                {{ memberPerformance[m.id].grade }}
              </span>
              <span class="m-perf-detail">
                {{ memberPerformance[m.id].completionRate }}% xong ·
                {{ memberPerformance[m.id].onTimeRate }}% đúng hạn
              </span>
            </div>
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
import type { Project, Task, AiAssessment } from '@/types';
import { projectService, taskService, userService } from '@/services/mockApiService';
import { getRolePermissions } from '@/utils/roleUtils';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const toast = useToast();

const project = ref<Project | null>(null);
const tasks = ref<Task[]>([]);
const loading = ref(true);
const tab = ref<'tasks' | 'prediction' | 'members' | 'summary'>('tasks');
const prediction = ref<any>(null);
const predicting = ref(false);

const tabs = [
  { key: 'tasks', label: 'Việc làm' },
  { key: 'prediction', label: 'Dự đoán' },
  { key: 'members', label: 'Thành viên' },
];

const computedTabs = computed(() => {
  if (project.value?.status === 'COMPLETED') {
    return [
      { key: 'tasks', label: '📋 Việc' },
      { key: 'summary', label: '🏆 Kết quả' },
      { key: 'members', label: '👥 Người' },
    ];
  }
  return tabs;
});

const progressColor = computed(() => {
  if (project.value?.status === 'COMPLETED') return '#22c55e';
  const p = project.value?.progress || 0;
  if (p >= 70) return 'var(--success)';
  if (p >= 40) return 'var(--warning)';
  return 'var(--danger)';
});

const getStatusLabel = (s: string) => {
  const map: Record<string, string> = {
    PENDING: 'Chờ',
    IN_PROGRESS: 'Đang làm',
    COMPLETED: 'Hoàn thành',
    DELAYED: 'Trễ',
  };
  return map[s?.toUpperCase()] || s;
};

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
const formatDateTime = (d: any) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const latestAssessment = computed<AiAssessment | null>(() => {
  const p = project.value;
  if (!p) return null;
  if (p.latestAiAssessment) return p.latestAiAssessment as AiAssessment;
  const list = p.aiAssessments;
  if (Array.isArray(list) && list.length) return list[list.length - 1];
  return null;
});

const showAiHistoryModal = ref(false);

const assessmentHistory = computed<AiAssessment[]>(() => {
  const list = project.value?.aiAssessments;
  if (!Array.isArray(list)) return [];
  return [...list].reverse();
});

interface TaskActionRec {
  taskId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
  label: string;
  reason: string;
  suggestion: string;
  daysRemaining: number | null;
  progress: number;
}

const taskActions = ref<Record<string, TaskActionRec>>({});

const getTaskAction = (taskId: string): TaskActionRec | null => {
  return taskActions.value[taskId] || null;
};

// ===== Create Task modal + subtasks =====
const userRole = ref<string>(localStorage.getItem('userRole') || '');
const canCreateTask = computed(() => {
  const p = getRolePermissions(userRole.value as any) || ({} as any);
  return !!p.canCreateTask;
});

const showCreateTaskModal = ref(false);
const savingTask = ref(false);
const newSubtaskTitle = ref('');

const taskForm = ref({
  title: '',
  description: '',
  assigneeId: '',
  status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
  startDate: '',
  dueDate: '',
  estimatedHours: 0,
  progress: 0,
  subtasks: [] as Array<{ title: string; done: boolean; assigneeId?: string | null }>,
});

function resetTaskForm() {
  taskForm.value = {
    title: '',
    description: '',
    assigneeId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    startDate: '',
    dueDate: '',
    estimatedHours: 0,
    progress: 0,
    subtasks: [],
  };
  newSubtaskTitle.value = '';
}

function openCreateTaskModal() {
  resetTaskForm();
  taskForm.value.startDate = new Date().toISOString().split('T')[0] || '';
  showCreateTaskModal.value = true;
}

function closeCreateTaskModal() {
  showCreateTaskModal.value = false;
  resetTaskForm();
}

function addSubtask() {
  const title = newSubtaskTitle.value.trim();
  if (!title) return;
  taskForm.value.subtasks.push({ title, done: false, assigneeId: null });
  newSubtaskTitle.value = '';
}

function removeSubtask(idx: number) {
  taskForm.value.subtasks.splice(idx, 1);
}

const assigneeOptions = computed(() => {
  const p = project.value;
  if (!p) return [];
  const arr: any[] = [];
  if (p.manager) arr.push(p.manager);
  (p.members || []).forEach((m: any) => {
    if (!arr.find((u) => u.id === m.id)) arr.push(m);
  });
  return arr;
});

async function handleCreateTask() {
  if (!project.value) return;
  if (!taskForm.value.title.trim()) {
    toast.error('Vui lòng nhập tên công việc');
    return;
  }
  if (!taskForm.value.dueDate) {
    toast.error('Vui lòng chọn hạn hoàn thành');
    return;
  }
  if (!taskForm.value.assigneeId) {
    toast.error('Vui lòng chọn người thực hiện');
    return;
  }

  savingTask.value = true;
  try {
    const payload: any = {
      projectId: project.value.id,
      title: taskForm.value.title.trim(),
      description: taskForm.value.description,
      assigneeId: taskForm.value.assigneeId,
      status: taskForm.value.status,
      priority: taskForm.value.priority,
      dueDate: taskForm.value.dueDate,
      progress: taskForm.value.progress,
      estimatedHours: taskForm.value.estimatedHours,
      subtasks: taskForm.value.subtasks.map((s) => ({ title: s.title, done: s.done })),
    };
    if (taskForm.value.startDate) payload.startDate = taskForm.value.startDate;

    const created = await taskService.createTask(payload);
    tasks.value.unshift(created);
    fetchTaskRecommendations(project.value.id);
    toast.success('Đã tạo công việc mới');
    closeCreateTaskModal();
  } catch (e: any) {
    toast.error(e.message || 'Không tạo được công việc');
  } finally {
    savingTask.value = false;
  }
}

async function toggleSubtaskDone(task: Task, sub: any) {
  try {
    const subId = sub._id || sub.id;
    if (!subId) return;
    const updated = await (taskService as any).toggleSubtask(task.id, subId, !sub.done);
    const idx = tasks.value.findIndex((t) => t.id === task.id);
    if (idx !== -1) tasks.value[idx] = updated;
  } catch (e: any) {
    toast.error(e.message || 'Không cập nhật được subtask');
  }
}

function subtaskStats(task: Task) {
  const list = task.subtasks || [];
  if (!list.length) return null;
  const done = list.filter((s: any) => s.done).length;
  return { done, total: list.length, percent: Math.round((done / list.length) * 100) };
}
const memberPerformance = ref<Record<string, any>>({});

async function fetchTaskRecommendations(projectId: string) {
  try {
    const res = await (projectService as any).getTaskRecommendations(projectId);
    const map: Record<string, TaskActionRec> = {};
    (res.recommendations || []).forEach((r: TaskActionRec) => {
      if (r.taskId) map[r.taskId] = r;
    });
    taskActions.value = map;
  } catch {
    taskActions.value = {};
  }
}

async function fetchMemberPerformances(members: any[]) {
  const results = await Promise.all(
    members.map(async (m) => {
      try {
        const perf = await (userService as any).getPerformance(m.id);
        return [m.id, perf] as const;
      } catch {
        return [m.id, null] as const;
      }
    })
  );
  const map: Record<string, any> = {};
  results.forEach(([id, perf]) => {
    if (perf) map[id] = perf;
  });
  memberPerformance.value = map;
}

const actionIcon = (action: string) => {
  const map: Record<string, string> = {
    DONE: '✓',
    MAINTAIN: '→',
    AHEAD: '↑',
    ACCELERATE: '⚡',
    ESCALATE: '🚨',
    EXTEND_OR_REASSIGN: '🔄',
    START_NOW: '▶',
  };
  return map[action] || '•';
};

const perfBadge = (score: number) => {
  if (score >= 85) return 'a-plus';
  if (score >= 70) return 'a';
  if (score >= 55) return 'b';
  if (score >= 40) return 'c';
  return 'd';
};

const triggerLabel = (type: string) => {
  const map: Record<string, string> = {
    TASK_PROGRESS: 'Cập nhật tiến độ',
    TASK_DONE: 'Hoàn thành việc',
    TASK_CREATED: 'Tạo việc mới',
    TASK_UPDATED: 'Sửa việc',
    TASK_REMOVED: 'Xoá việc',
    MANUAL: 'Thủ công',
  };
  return map[type] || type;
};
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
  const map: Record<string, string> = { LOW: 'Dễ', MEDIUM: 'Vừa', HIGH: 'Khó' };
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
    toast.success('AI Analysis Completed', 'Progress Prediction');
  } catch (e: any) {
    toast.error(e.message || 'AI Error');
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

    // Fetch AI task recommendations và member performance song song
    fetchTaskRecommendations(id);
    if (p?.members?.length) fetchMemberPerformances(p.members);
  } catch (e: any) {
    toast.error(e.message || 'Failed to load data');
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
.m-label { font-size: 11px; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px; }
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
.chip-label { font-size: 11px; color: var(--primary); font-weight: 700; }
.chip-value { font-size: 14px; font-weight: 700; color: var(--primary-hover); }
.ring-wrap { display: flex; flex-direction: column; align-items: center; }
.ring-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

/* ===== AI Auto Assessment Banner ===== */
.ai-auto-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: linear-gradient(135deg, #eff6ff, #e0e7ff);
  border-left: 4px solid #3b82f6;
  animation: heroSlideIn 0.3s ease;
}

.ai-auto-banner--medium {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-left-color: #f59e0b;
}

.ai-auto-banner--high {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border-left-color: #ef4444;
}

.ai-auto-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.ai-auto-body {
  flex: 1;
  min-width: 0;
}

.ai-auto-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.ai-auto-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-history-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.ai-history-btn:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* AI History Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ai-history-modal {
  max-width: 720px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 16px;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.ai-history-body {
  padding: 18px 22px 22px;
  overflow-y: auto;
}

.ai-history-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.ai-history-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: #f8fafc;
  border: 1px solid var(--border);
  border-left-width: 4px;
}

.ai-history-item--low { border-left-color: #22c55e; }
.ai-history-item--medium { border-left-color: #f59e0b; background: #fffbeb; }
.ai-history-item--high { border-left-color: #ef4444; background: #fef2f2; }

.ai-history-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.dot-low { background: #22c55e; }
.dot-medium { background: #f59e0b; }
.dot-high { background: #ef4444; }

.ai-history-content {
  flex: 1;
  min-width: 0;
}

.ai-history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ai-history-headline {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-main);
}

.ai-history-time {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.ai-history-summary {
  font-size: 12.5px;
  color: var(--text-main);
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.ai-history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  background: white;
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.chip-progress { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.chip-expected { background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }
.chip-risk-low { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
.chip-risk-medium { background: #fef3c7; color: #d97706; border-color: #fde68a; }
.chip-risk-high { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.chip-delay { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.chip-trigger { background: #f1f5f9; color: #475569; }

.ai-auto-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
}

.ai-auto-time {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.ai-auto-summary {
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.55;
  margin: 0 0 10px 0;
}

.ai-auto-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.ai-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
}

.ai-metric-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.ai-metric-value {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
}

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
.tbl th { text-align: left; font-size: 11px; color: var(--text-muted); padding: 10px 12px; border-bottom: 1px solid var(--border); font-weight: 700; letter-spacing: 0.5px; }
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
.rec-title { font-size: 12px; color: var(--primary); font-weight: 700; margin-bottom: 4px; }
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

/* Kanban subtasks */
.kc-subtasks {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

.kc-sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}
.kc-sub-icon { font-size: 12px; }
.kc-sub-count { white-space: nowrap; }
.kc-sub-bar {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.kc-sub-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.kc-sub-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kc-sub-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-main);
  cursor: pointer;
  padding: 2px 0;
  line-height: 1.35;
}

.kc-sub-item input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: #10b981;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}

.kc-sub-done span {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Create Task Modal */
.create-task-modal { max-width: 620px; }

.ct-form {
  padding: 20px 22px 22px;
  overflow-y: auto;
  max-height: calc(85vh - 64px);
}

.ct-form .form-group { margin-bottom: 14px; }
.ct-form label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}
.ct-form input, .ct-form select, .ct-form textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: inherit;
  background: white;
  transition: border-color 0.15s;
}
.ct-form input:focus, .ct-form select:focus, .ct-form textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.ct-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.subtasks-section {
  margin: 8px 0 18px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.subtasks-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.subtasks-head label { margin-bottom: 0; }
.subtasks-hint {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.subtask-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 8px;
}

.sub-num {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-soft, #eff6ff);
  padding: 1px 7px;
  border-radius: 999px;
  flex-shrink: 0;
  min-width: 22px;
  text-align: center;
}

.sub-title-input {
  flex: 1;
  border: none !important;
  padding: 4px 6px !important;
  font-size: 13px !important;
  background: transparent !important;
}

.sub-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 6px;
  flex-shrink: 0;
}
.sub-remove:hover { color: var(--danger); }

.subtask-add {
  display: flex;
  gap: 8px;
}

.subtask-add input {
  flex: 1;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Kanban card AI action tip */
.kc-ai {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 11px;
  align-items: flex-start;
}
.kc-ai--medium {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.kc-ai--high {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
.kc-ai-icon {
  font-size: 14px;
  line-height: 1.2;
  flex-shrink: 0;
}
.kc-ai-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.kc-ai-label {
  font-weight: 800;
  font-size: 11px;
}
.kc-ai-sug {
  font-size: 11px;
  line-height: 1.4;
  color: inherit;
  opacity: 0.9;
}

/* Member performance mini */
.m-perf {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.m-perf-grade {
  font-size: 10px;
  font-weight: 900;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--primary);
  color: white;
  letter-spacing: 0.5px;
}
.m-perf--a-plus { background: #16a34a; }
.m-perf--a { background: #22c55e; }
.m-perf--b { background: #2563eb; }
.m-perf--c { background: #f59e0b; }
.m-perf--d { background: #ef4444; }

.m-perf-detail {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== COMPLETED PROJECT STYLES ===== */

/* Hero Banner */
.completed-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  padding: 20px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  animation: heroSlideIn 0.4s ease;
}

@keyframes heroSlideIn {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.completed-hero-icon {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.completed-hero-text {
  flex: 1;
}

.completed-hero-text h2 {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 4px 0;
  font-family: 'Outfit', sans-serif;
}

.completed-hero-text p {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
}

.completed-hero-badge {
  font-size: 22px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
  flex-shrink: 0;
}

/* Header completed state */
.detail-header--completed {
  border: 1.5px solid #86efac;
  background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 100%);
  position: relative;
  overflow: hidden;
}

.detail-header--completed::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

/* Completed date highlight */
.completed-date-value {
  color: #16a34a !important;
  font-weight: 700 !important;
}

/* AI Chip completed */
.ai-chip--completed {
  background: #dcfce7 !important;
  border: 1px solid #86efac;
}

.ai-chip--completed .chip-label {
  color: #16a34a !important;
}

.ai-chip--completed .chip-value {
  color: #15803d !important;
}

/* Ring label done */
.ring-label--done {
  color: #16a34a !important;
  font-weight: 700 !important;
}

/* Button success */
.btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

/* Task summary pills */
.task-summary-pills {
  display: flex;
  gap: 8px;
}

.pill {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
}

.pill-done { background: #dcfce7; color: #16a34a; }
.pill-warn { background: #fef3c7; color: #d97706; }

/* ===== SUMMARY TAB ===== */
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.summary-hero {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 14px;
  gap: 8px;
  text-align: center;
}

.ss-val {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  line-height: 1;
}

.ss-val.ss-green { color: #16a34a; }

.ss-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Timeline */
.summary-timeline {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.timeline-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  margin: 0 12px;
  position: relative;
}

.timeline-line::after {
  content: '▶';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  color: #16a34a;
  font-size: 12px;
}

.tl-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tl-dot.tl-start { background: #94a3b8; border: 2px solid white; box-shadow: 0 0 0 2px #94a3b8; }
.tl-dot.tl-end   { background: #16a34a; border: 2px solid white; box-shadow: 0 0 0 2px #16a34a; }

.tl-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0 0 4px 0;
}

.tl-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

/* AI Summary Box */
.summary-ai-box {
  padding: 20px;
  background: var(--primary-soft, #eff6ff);
  border: 1px solid var(--primary);
  border-radius: 14px;
}

.summary-ai-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.summary-ai-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .summary-hero { grid-template-columns: repeat(2, 1fr); }
  .summary-ai-row { grid-template-columns: 1fr; }
  .completed-hero { flex-direction: column; text-align: center; }
  .completed-hero-badge { display: none; }
}

.kc-subtasks-done-badge {
  margin-top: 8px;
  font-size: 11px;
  color: #16a34a;
  font-weight: 600;
  background: #f0fdf4;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
