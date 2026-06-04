<script setup lang="ts">
defineProps<{
  leaderDistNow: number;
  totalDistance: number;
  minimapSegments: { start: number; end: number; type: string; label: string }[];
}>();
</script>

<template>
  <div v-if="minimapSegments.length" class="px-6 pb-2">
    <svg viewBox="0 0 1200 36" class="w-full max-w-[1200px] mx-auto" style="display:block">
      <rect x="10" y="10" width="1180" height="14" rx="4" fill="#1e293b" opacity="0.6"/>
      <template v-for="seg in minimapSegments" :key="seg.label + seg.start">
        <rect
          :x="10 + (seg.start / totalDistance) * 1180"
          :y="10"
          :width="Math.max(2, ((seg.end - seg.start) / totalDistance) * 1180)"
          height="14"
          :rx="2"
          :fill="seg.type === 'corner' ? '#c08b5b' : seg.type === 'uphill' ? '#84cc16' : seg.type === 'downhill' ? '#fbbf24' : '#4f6d7a'"
          :opacity="seg.type === 'straight' ? '0.3' : '0.5'"
        />
      </template>
      <rect x="10" y="10" width="1180" height="14" rx="4" fill="none" stroke="#334155" stroke-width="1"/>
      <polygon
        :points="`${10 + (leaderDistNow / totalDistance) * 1180},6 ${10 + (leaderDistNow / totalDistance) * 1180 - 5},14 ${10 + (leaderDistNow / totalDistance) * 1180 + 5},14`"
        fill="#f59e0b"
      />
      <line x1="10" y1="10" x2="10" y2="24" stroke="#475569" stroke-width="1"/>
      <line x1="1190" y1="10" x2="1190" y2="24" stroke="#475569" stroke-width="1"/>
      <text x="10" y="34" fill="#64748b" font-size="9" font-family="monospace" text-anchor="middle">Start</text>
      <text x="1190" y="34" fill="#f59e0b" font-size="9" font-family="monospace" text-anchor="middle">Goal</text>
      <text x="600" y="5" fill="#475569" font-size="8" font-family="monospace" text-anchor="middle">{{ totalDistance }}m</text>
    </svg>
  </div>
</template>
