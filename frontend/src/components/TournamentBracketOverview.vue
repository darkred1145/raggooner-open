<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { Tournament, Team, Race } from '../types';

const props = defineProps<{
  tournament: Tournament;
}>();

const tournamentRef = toRef(props, 'tournament');

// Group teams by their group
const teamsByGroup = computed(() => {
  const groups: Record<string, Team[]> = {};
  
  tournamentRef.value.teams.forEach(team => {
    const groupTeams = groups[team.group] ?? [];
    groupTeams.push(team);
    groups[team.group] = groupTeams;
  });

  // Sort teams within each group by points
  Object.keys(groups).forEach(group => {
    const groupTeams = groups[group];
    if (!groupTeams) return;

    groupTeams.sort((a, b) => {
      // Sort by group points first, then by finals points
      const groupDiff = (b.points || 0) - (a.points || 0);
      if (groupDiff !== 0) return groupDiff;
      return (b.finalsPoints || 0) - (a.finalsPoints || 0);
    });
  });

  return groups;
});

// Get races by group
const racesByGroup = computed(() => {
  const races: Record<string, Race[]> = {};
  
  Object.values(tournamentRef.value.races).forEach(race => {
    const groupRaces = races[race.group] ?? [];
    groupRaces.push(race);
    races[race.group] = groupRaces;
  });

  // Sort races by number
  Object.keys(races).forEach(group => {
    const groupRaces = races[group];
    if (!groupRaces) return;
    groupRaces.sort((a, b) => a.raceNumber - b.raceNumber);
  });

  return races;
});

// Calculate completed races per group
const completedRacesByGroup = computed(() => {
  const completed: Record<string, number> = {};
  
  Object.keys(teamsByGroup.value).forEach(group => {
    const groupRaces = racesByGroup.value[group] || [];
    completed[group] = groupRaces.length;
  });

  return completed;
});

// Determine tournament stage
const tournamentStage = computed(() => {
  const totalTeams = tournamentRef.value.teams.length;
  const groupsWithTeams = Object.keys(teamsByGroup.value).length;
  
  if (totalTeams >= 27) {
    return groupsWithTeams > 3 ? 'Group Stage' : 'Finals';
  } else if (totalTeams >= 9) {
    return 'Group Stage';
  } else {
    return 'Single Stage';
  }
});

// Get finalists for tournaments with groups
const finalists = computed(() => {
  if (tournamentStage.value !== 'Group Stage') {
    return tournamentRef.value.teams;
  }
  
  return tournamentRef.value.teams.filter(team => team.inFinals);
});

const getGroupProgress = (group: string) => {
  const teamCount = teamsByGroup.value[group]?.length ?? 0;
  const totalRaces = Math.ceil(teamCount / 3);
  const completed = completedRacesByGroup.value[group] || 0;
  return {
    total: totalRaces,
    completed: completed,
    percentage: totalRaces > 0 ? Math.round((completed / totalRaces) * 100) : 0
  };
};
</script>

<template>
  <div class="space-y-6">
    <!-- Tournament Header -->
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-white">{{ tournament.name }}</h2>
          <p class="text-slate-400">{{ tournamentStage }} • {{ tournament.teams.length }} Teams</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-slate-400">Status</div>
          <div class="text-lg font-bold" 
               :class="{
                 'text-emerald-400': tournament.status === 'completed',
                 'text-amber-400': tournament.status === 'active',
                 'text-indigo-400': tournament.status === 'draft',
                 'text-slate-400': tournament.status === 'registration'
               }">
            {{ tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Stage Overview -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Group Stage -->
      <div v-if="tournamentStage === 'Group Stage'" class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="ph-fill ph-layout text-indigo-400"></i>
          Group Stage
        </h3>
        <div class="grid gap-4">
          <div v-for="(teams, group) in teamsByGroup" :key="group" 
               class="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-lg text-white">Group {{ group }}</h4>
              <div class="text-sm text-slate-400">
                {{ getGroupProgress(group).completed }}/{{ getGroupProgress(group).total }} races
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-slate-700 rounded-full h-2 mb-4">
              <div class="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                   :style="{ width: `${getGroupProgress(group).percentage}%` }"></div>
            </div>

            <!-- Teams -->
            <div class="space-y-2">
              <div v-for="team in teams" :key="team.id"
                   class="flex items-center justify-between p-2 rounded-lg border transition-colors"
                   :class="team.inFinals ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-700/30 border-slate-600'">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                       :style="{ backgroundColor: team.color + '40', color: team.color }">
                    {{ team.name.charAt(5) }}
                  </div>
                  <span class="font-medium text-white">{{ team.name }}</span>
                </div>
                <div class="text-sm font-mono">
                  <span class="text-indigo-400">{{ team.points || 0 }}</span>
                  <span class="text-slate-500"> pts</span>
                  <span v-if="team.inFinals" class="ml-2 text-emerald-400">
                    <i class="ph-fill ph-star text-xs"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Finals or Single Stage -->
      <div v-else class="space-y-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="ph-fill ph-trophy text-amber-400"></i>
          {{ tournamentStage }}
        </h3>
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div class="grid gap-3">
            <div v-for="team in tournament.teams" :key="team.id"
                 class="flex items-center justify-between p-3 rounded-lg border"
                 :class="team.inFinals ? 'bg-amber-900/20 border-amber-500/50' : 'bg-slate-700/30 border-slate-600'">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                     :style="{ backgroundColor: team.color + '40', color: team.color }">
                  {{ team.name.charAt(5) }}
                </div>
                <div>
                  <div class="font-bold text-white">{{ team.name }}</div>
                  <div class="text-xs text-slate-400">Captain: {{ team.captainId }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-amber-400">{{ team.finalsPoints || 0 }}</div>
                <div class="text-xs text-slate-500">Finals Points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament Progress -->
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 class="text-lg font-bold text-white mb-4">Tournament Progress</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-indigo-400">{{ tournament.teams.length }}</div>
          <div class="text-xs text-slate-400 uppercase">Teams</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ Object.keys(tournament.races).length }}</div>
          <div class="text-xs text-slate-400 uppercase">Races Completed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-amber-400">{{ finalists.length }}</div>
          <div class="text-xs text-slate-400 uppercase">Finalists</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">{{ tournament.playerIds.length }}</div>
          <div class="text-xs text-slate-400 uppercase">Players</div>
        </div>
      </div>
    </div>

    <!-- Bracket Preview (Simplified) -->
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 class="text-lg font-bold text-white mb-4">Tournament Structure</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <span class="font-medium text-white">Registration</span>
          <i class="ph-fill ph-check-circle text-emerald-400"></i>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <span class="font-medium text-white">Player Draft</span>
          <i class="ph-fill ph-check-circle text-emerald-400"></i>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <span class="font-medium text-white">Uma Draft</span>
          <i class="ph-fill ph-check-circle text-emerald-400"></i>
        </div>
        <div class="flex items-center justify-between p-3" 
             :class="tournament.status === 'active' ? 'bg-emerald-900/20 border border-emerald-500/50' : 'bg-slate-700/30'">
          <span class="font-medium text-white">Active Races</span>
          <i v-if="tournament.status === 'active'" class="ph-fill ph-spinner animate-spin text-amber-400"></i>
          <i v-else class="ph-fill ph-circle text-slate-500"></i>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <span class="font-medium text-white">Completed</span>
          <i class="ph-fill ph-circle text-slate-500"></i>
        </div>
      </div>
    </div>
  </div>
</template>
