<template>
  <div class="bar-chart">
    <div v-for="item in data" :key="item.label" class="bar-row">
      <div class="bar-top">
        <span class="bar-label">{{ item.label }}</span>
        <span class="bar-value">{{ item.value }}</span>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{ width: widthOf(item.value) + '%', background: item.color || 'var(--primary)' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: { label: string; value: number; color?: string }[];
}>();

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)));
const widthOf = (v: number) => Math.round((v / max.value) * 100);
</script>

<style scoped>
.bar-chart { display: flex; flex-direction: column; gap: 12px; }
.bar-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
  color: var(--text-muted);
  font-weight: 600;
}
.bar-label { color: var(--text-main); }
.bar-value { color: var(--text-main); font-weight: 700; }
.bar-track { height: 10px; background: var(--border); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s var(--ease); }
</style>
