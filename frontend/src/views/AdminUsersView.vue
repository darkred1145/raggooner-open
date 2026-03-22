<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';
import PlayerProfileModal from '../components/PlayerProfileModal.vue';
import { useUserRoles } from '../composables/useUserRoles';
import type { GlobalPlayer, UserRole } from '../types';

const { isSuperAdmin, setUserRole, fetchAllRoles, fetchAllPlayers } = useUserRoles();

const players = ref<GlobalPlayer[]>([]);
const roleMap = ref<Record<string, UserRole>>({});
const loading = ref(true);
const saving = ref<string | null>(null);
const searchQuery = ref('');
const statusMessage = ref('');

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'player', label: 'Player' },
    { value: 'tournament_creator', label: 'Tournament Creator' },
    { value: 'superadmin', label: 'Superadmin' },
];

const ROLE_BADGE: Record<UserRole, string> = {
    player: 'bg-slate-700 text-slate-300 border-slate-600',
    tournament_creator: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/50',
    superadmin: 'bg-amber-900/40 text-amber-300 border-amber-500/50',
};

onMounted(async () => {
    if (!isSuperAdmin.value) return;
    try {
        const [allPlayers, allRoles] = await Promise.all([fetchAllPlayers(), fetchAllRoles()]);
        players.value = allPlayers.filter(p => p.firebaseUid);
        const map: Record<string, UserRole> = {};
        for (const entry of allRoles) {
            map[entry.uid] = entry.role;
        }
        roleMap.value = map;
    } catch (e) {
        console.error('Failed to load users:', e);
    } finally {
        loading.value = false;
    }
});

const filteredPlayers = computed(() => {
    const q = searchQuery.value.toLowerCase();
    if (!q) return players.value;
    return players.value.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.discordId?.includes(q) ||
        p.firebaseUid?.includes(q)
    );
});

const getRole = (uid: string): UserRole => roleMap.value[uid] ?? 'player';

const profileModalOpen = ref(false);
const profilePlayer = ref<GlobalPlayer | null>(null);

const openProfile = (player: GlobalPlayer) => {
    profilePlayer.value = player;
    profileModalOpen.value = true;
};

const changeRole = async (player: GlobalPlayer, newRole: UserRole) => {
    if (!player.firebaseUid) return;
    saving.value = player.firebaseUid;
    statusMessage.value = '';
    try {
        await setUserRole(player.firebaseUid, newRole, player.name);
        roleMap.value = { ...roleMap.value, [player.firebaseUid]: newRole };
        statusMessage.value = `Updated ${player.name} to ${newRole}`;
        setTimeout(() => { statusMessage.value = ''; }, 3000);
    } catch (e) {
        statusMessage.value = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    } finally {
        saving.value = null;
    }
};
</script>

<template>
    <div class="w-full flex flex-col min-h-full">
        <SiteHeader />

        <main class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div class="max-w-4xl mx-auto">
                <SiteNav />

                <div v-if="!isSuperAdmin" class="mt-12 text-center text-slate-500">
                    <i class="ph ph-lock text-5xl mb-4 block"></i>
                    <p class="text-lg">Access denied. Superadmin only.</p>
                </div>

                <template v-else>
                    <div class="mt-8 mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                                <i class="ph-bold ph-shield-check text-amber-400"></i>
                                User Management
                            </h1>
                            <p class="text-sm text-slate-400 mt-1">Assign roles to linked Discord users.</p>
                        </div>
                        <div class="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                            {{ players.length }} linked users
                        </div>
                    </div>

                    <div v-if="statusMessage" class="mb-4 px-4 py-2 rounded-lg text-sm"
                         :class="statusMessage.startsWith('Error') ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-green-900/30 text-green-400 border border-green-500/30'">
                        {{ statusMessage }}
                    </div>

                    <input v-model="searchQuery"
                           type="text"
                           placeholder="Search by name, Discord ID, or Firebase UID..."
                           class="w-full mb-4 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />

                    <div v-if="loading" class="text-center py-12">
                        <i class="ph ph-spinner animate-spin text-4xl text-indigo-500"></i>
                    </div>

                    <div v-else-if="filteredPlayers.length === 0" class="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No linked users found.
                    </div>

                    <div v-else class="space-y-2">
                        <div v-for="player in filteredPlayers" :key="player.id"
                             class="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">

                            <img v-if="player.avatarUrl"
                                 :src="player.avatarUrl"
                                 class="w-9 h-9 rounded-full flex-shrink-0"
                                 :alt="player.name" />
                            <div v-else class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <i class="ph ph-user text-slate-400"></i>
                            </div>

                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-white text-sm truncate">{{ player.name }}</div>
                                <div class="text-xs text-slate-500 font-mono truncate">
                                    <span v-if="player.discordId">Discord: {{ player.discordId }}</span>
                                    <span v-else>UID: {{ player.firebaseUid }}</span>
                                </div>
                            </div>

                            <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0"
                                  :class="ROLE_BADGE[getRole(player.firebaseUid!)]">
                                {{ getRole(player.firebaseUid!).replace('_', ' ') }}
                            </span>

                            <button @click="openProfile(player)"
                                    title="View Profile"
                                    class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex-shrink-0">
                                <i class="ph-bold ph-user-circle text-lg"></i>
                            </button>

                            <select :value="getRole(player.firebaseUid!)"
                                    :disabled="saving === player.firebaseUid"
                                    @change="changeRole(player, ($event.target as HTMLSelectElement).value as UserRole)"
                                    class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 cursor-pointer">
                                <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>

                            <i v-if="saving === player.firebaseUid"
                               class="ph ph-spinner animate-spin text-indigo-400 flex-shrink-0"></i>
                        </div>
                    </div>
                </template>
            </div>
        </main>
    </div>

    <PlayerProfileModal
        :open="profileModalOpen"
        :player-name="profilePlayer?.name ?? ''"
        :global-player="profilePlayer"
        @close="profileModalOpen = false"
    />
</template>
