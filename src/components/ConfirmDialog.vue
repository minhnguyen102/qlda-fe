<template>
  <div v-if="open" class="modal-overlay" @click.self="cancel">
    <div class="modal-content confirm-box">
      <div class="icon-wrap" :class="'icon-' + kind">
        <span v-if="kind === 'danger'">!</span>
        <span v-else>?</span>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="actions">
        <button class="btn btn-ghost" @click="cancel">{{ cancelText }}</button>
        <button class="btn" :class="kind === 'danger' ? 'btn-danger' : 'btn-primary'" @click="confirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  kind?: 'danger' | 'default';
}>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const confirm = () => emit('confirm');
const cancel = () => emit('cancel');
</script>

<script lang="ts">
export default {
  props: {
    confirmText: { type: String, default: 'Xác nhận' },
    cancelText: { type: String, default: 'Huỷ' },
    kind: { type: String as () => 'danger' | 'default', default: 'default' },
  },
};
</script>

<style scoped>
.confirm-box {
  max-width: 420px;
  padding: 28px;
  text-align: center;
}
.icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  margin: 0 auto 16px;
  color: white;
}
.icon-danger { background: var(--danger); }
.icon-default { background: var(--primary); }
h3 { margin-bottom: 8px; }
p { color: var(--text-muted); margin-bottom: 24px; font-size: 14px; }
.actions { display: flex; justify-content: center; gap: 12px; }
</style>
