<template>
  <div class="donut-wrap">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`translate(${size / 2}, ${size / 2})`">
        <circle r="45" fill="none" stroke="var(--border)" stroke-width="12" />
        <circle
          v-for="seg in segments"
          :key="seg.label"
          r="45"
          fill="none"
          :stroke="seg.color"
          stroke-width="12"
          :stroke-dasharray="`${seg.len} ${circumference}`"
          :stroke-dashoffset="seg.offset"
          stroke-linecap="round"
          transform="rotate(-90)"
        />
        <text text-anchor="middle" dy="4" class="donut-center">
          {{ total }}
        </text>
        <text text-anchor="middle" dy="22" class="donut-sub">{{ centerLabel }}</text>
      </g>
    </svg>
    <ul class="legend">
      <li v-for="seg in segments" :key="seg.label">
        <span class="dot" :style="{ background: seg.color }"></span>
        <span class="lbl">{{ seg.label }}</span>
        <span class="val">{{ seg.value }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
}>();

const size = computed(() => props.size || 180);
const circumference = computed(() => 2 * Math.PI * 45);

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0));

const segments = computed(() => {
  if (!total.value) return [];
  let acc = 0;
  return props.data.map((d) => {
    const len = (d.value / total.value) * circumference.value;
    const offset = -acc;
    acc += len;
    return { ...d, len, offset };
  });
});
</script>

<style scoped>
.donut-wrap {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}
.donut-center { font-size: 22px; font-weight: 800; fill: var(--text-main); font-family: 'Outfit', sans-serif; }
.donut-sub { font-size: 10px; fill: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.legend { list-style: none; padding: 0; margin: 0; flex: 1; min-width: 160px; }
.legend li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--border);
}
.legend li:last-child { border-bottom: none; }
.dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.lbl { flex: 1; color: var(--text-main); }
.val { font-weight: 700; color: var(--text-main); }
</style>
