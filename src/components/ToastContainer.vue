<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="toast"
        :class="'toast-' + t.kind"
      >
        <div class="toast-icon">
          <span v-if="t.kind === 'success'">✓</span>
          <span v-else-if="t.kind === 'error'">✕</span>
          <span v-else-if="t.kind === 'warning'">!</span>
          <span v-else>i</span>
        </div>
        <div class="toast-body">
          <p v-if="t.title" class="toast-title">{{ t.title }}</p>
          <p class="toast-message">{{ t.message }}</p>
        </div>
        <button class="toast-close" @click="toast.dismiss(t.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';
const toast = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 320px;
  max-width: 420px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: auto;
  border-left: 4px solid var(--info);
}

.toast-success { border-left-color: var(--success); }
.toast-error { border-left-color: var(--danger); }
.toast-warning { border-left-color: var(--warning); }

.toast-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
}

.toast-success .toast-icon { background: var(--success); }
.toast-error .toast-icon { background: var(--danger); }
.toast-warning .toast-icon { background: var(--warning); }
.toast-info .toast-icon { background: var(--info); }

.toast-body { flex: 1; min-width: 0; }
.toast-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--text-main);
}
.toast-message {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.45;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-soft);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.toast-close:hover { color: var(--text-main); }

.toast-enter-active, .toast-leave-active { transition: all 0.25s var(--ease); }
.toast-enter-from { opacity: 0; transform: translateX(32px); }
.toast-leave-to { opacity: 0; transform: translateX(32px); }
</style>
