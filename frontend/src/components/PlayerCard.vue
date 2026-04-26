<script setup lang="ts">
import PlayerAvatar from './shared/PlayerAvatar.vue';

type DraftablePlayer = {
  id: string;
  name: string;
};

const props = defineProps<{
  player: DraftablePlayer;
  avatarUrl?: string;
  dominancePct?: number | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  selected: [];
  'view-profile': [playerId: string];
}>();
</script>

<template>
  <div class="relative min-h-[80px]" role="listitem">
    <button
      :disabled="disabled"
      :aria-label="`Draft ${player.name}`"
      class="group flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-3 text-left shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-600 hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      title="Click to Draft"
      @click="emit('selected')"
    >
      <div class="relative z-10 flex min-w-0 w-full items-center gap-2 pr-4">
        <PlayerAvatar :name="player.name" :avatar-url="avatarUrl" class="shrink-0" size="md" />
        <span class="truncate font-bold text-slate-200 group-hover:text-white" :title="player.name">
          {{ player.name }}
        </span>
      </div>

      <div
        v-if="dominancePct !== null && dominancePct !== undefined"
        class="relative z-10 mt-3 flex w-fit items-center gap-1.5 rounded-md border border-slate-700/50 bg-slate-900/60 px-2 py-1 transition-colors group-hover:border-indigo-400/30 group-hover:bg-indigo-900/40"
        title="Win Rate / Dominance"
      >
        <i class="ph-fill ph-sword text-xs text-indigo-400 group-hover:text-indigo-300" aria-hidden="true"></i>
        <span class="text-xs font-bold tracking-wide text-slate-300 group-hover:text-white">
          {{ dominancePct.toFixed(1) }}%
        </span>
      </div>

      <div class="pointer-events-none absolute -bottom-2 -right-2 p-2 text-slate-700 opacity-20 transition-colors group-hover:text-indigo-400" aria-hidden="true">
        <i class="ph-fill ph-steering-wheel text-5xl"></i>
      </div>
    </button>

    <button
      :aria-label="`View profile for ${player.name}`"
      class="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded text-indigo-400/60 transition-colors hover:bg-slate-700 hover:text-indigo-400"
      title="View Profile"
      @click.stop="emit('view-profile', player.id)"
    >
      <i class="ph-bold ph-user-circle text-sm" aria-hidden="true"></i>
    </button>
  </div>
</template>
