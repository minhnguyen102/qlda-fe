import { reactive } from 'vue';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
  timeout: number;
}

const state = reactive<{ items: Toast[] }>({ items: [] });
let nextId = 1;

function push(kind: ToastKind, message: string, title?: string, timeout = 3500) {
  const id = nextId++;
  state.items.push({ id, kind, message, title, timeout });
  if (timeout > 0) {
    setTimeout(() => dismiss(id), timeout);
  }
}

function dismiss(id: number) {
  const idx = state.items.findIndex((t) => t.id === id);
  if (idx !== -1) state.items.splice(idx, 1);
}

export function useToast() {
  return {
    items: state.items,
    success: (msg: string, title?: string) => push('success', msg, title),
    error: (msg: string, title?: string) => push('error', msg, title),
    info: (msg: string, title?: string) => push('info', msg, title),
    warning: (msg: string, title?: string) => push('warning', msg, title),
    dismiss,
  };
}
