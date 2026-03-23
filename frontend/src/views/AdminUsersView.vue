<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

defineOptions({ inheritAttrs: false });
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';
import PlayerProfileModal from '../components/PlayerProfileModal.vue';
import { useUserRoles } from '../composables/useUserRoles';
import type { GlobalPlayer, UserRole } from '../types';

const { can, isSuperAdmin, setUserRole, unlinkPlayer, fetchAllRoles, fetchAllPlayers } = useUserRoles();

const players = ref<GlobalPlayer[]>([]);
const roleMap = ref<Record<string, UserRole>>({});
const loading = ref(true);
const saving = ref<string | null>(null);
const searchQuery = ref('');
const statusMessage = ref('');

// ── Role toggle helpers ────────────────────────────────────────────────────────

const setRole = async (player: GlobalPlayer, newRole: UserRole, confirmMsg?: string) => {
    if (!player.firebaseUid) return;
    if (confirmMsg && !confirm(confirmMsg)) return;
    saving.value = player.firebaseUid;
    statusMessage.value = '';
    try {
        await setUserRole(player.firebaseUid, newRole, player.name);
        roleMap.value = { ...roleMap.value, [player.firebaseUid]: newRole };
    } catch (e) {
        statusMessage.value = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    } finally {
        saving.value = null;
    }
};

const toggleSuperAdmin = async (player: GlobalPlayer, promote: boolean) => {
    const msg = promote
        ? `Promote ${player.name} to superadmin?\n\nThey will gain full admin access including the superadmin panel.`
        : `Revoke superadmin from ${player.name}?\n\nThey will lose all superadmin privileges.`;
    await setRole(player, promote ? 'superadmin' : 'player', msg);
    if (!statusMessage.value) {
        statusMessage.value = promote ? `${player.name} is now a superadmin` : `Revoked superadmin from ${player.name}`;
        setTimeout(() => { statusMessage.value = ''; }, 3000);
    }
};

const toggleAdmin = async (player: GlobalPlayer, promote: boolean) => {
    await setRole(player, promote ? 'admin' : 'player');
    if (!statusMessage.value) {
        statusMessage.value = promote ? `${player.name} is now an admin` : `Revoked admin from ${player.name}`;
        setTimeout(() => { statusMessage.value = ''; }, 3000);
    }
};

const toggleCreator = async (player: GlobalPlayer, isCreator: boolean) => {
    await setRole(player, isCreator ? 'tournament_creator' : 'player');
    if (!statusMessage.value) {
        statusMessage.value = isCreator
            ? `${player.name} can now create official tournaments`
            : `${player.name} can no longer create official tournaments`;
        setTimeout(() => { statusMessage.value = ''; }, 3000);
    }
};

// ── Data loading ───────────────────────────────────────────────────────────────

onMounted(async () => {
    if (!can('manage_users')) return;
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

// ── Profile modal ──────────────────────────────────────────────────────────────

const profileModalOpen = ref(false);
const profilePlayer = ref<GlobalPlayer | null>(null);

const openProfile = (player: GlobalPlayer) => {
    profilePlayer.value = player;
    profileModalOpen.value = true;
};

// ── Unlink ─────────────────────────────────────────────────────────────────────

const unlinking = ref<string | null>(null);

const handleUnlink = async (player: GlobalPlayer) => {
    if (!confirm(`Unlink Discord account from "${player.name}"?\n\nTheir stats and tournament history will be kept. They will need to re-link on their next visit.`)) return;
    unlinking.value = player.id;
    try {
        await unlinkPlayer(player.id);
        players.value = players.value.filter(p => p.id !== player.id);
        statusMessage.value = `Unlinked Discord account from ${player.name}`;
        setTimeout(() => { statusMessage.value = ''; }, 3000);
    } catch (e) {
        statusMessage.value = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    } finally {
        unlinking.value = null;
    }
};
</script>

<template>
    <div v-bind="$attrs" class="w-full flex flex-col min-h-full">
        <SiteHeader />

        <main class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div class="max-w-4xl mx-auto">
                <SiteNav />

                <div v-if="!can('manage_users')" class="mt-12 text-center text-slate-500">
                    <i class="ph ph-lock text-5xl mb-4 block"></i>
                    <p class="text-lg">Access denied.</p>
                </div>

                <template v-else>
                    <div class="mt-8 mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
                                <i class="ph-bold ph-shield-check text-amber-400"></i>
                                User Management
                            </h1>
                            <p class="text-sm text-slate-400 mt-1">Manage permissions for linked Discord users.</p>
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
                             class="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">

                            <img v-if="player.avatarUrl"
                                 :src="player.avatarUrl"
                                 class="w-9 h-9 rounded-full flex-shrink-0"
                                 :alt="player.name" />
                            <div v-else class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <i class="ph ph-user text-slate-400"></i>
                            </div>

                            <div class="flex-1 min-w-0 space-y-0.5">
                                <div class="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                                    <i class="ph-fill ph-discord-logo text-[#5865F2] shrink-0"></i>
                                    <span class="font-mono truncate">{{ player.discordId ?? player.firebaseUid }}</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-sm truncate">
                                    <i class="ph-bold ph-user text-slate-500 shrink-0"></i>
                                    <span class="font-semibold text-white truncate">{{ player.name }}</span>
                                </div>
                            </div>

                            <!-- Superadmin player row -->
                            <template v-if="getRole(player.firebaseUid!) === 'superadmin'">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 bg-amber-900/40 text-amber-300 border-amber-500/50">
                                    Superadmin
                                </span>
                                <!-- Only superadmins can revoke superadmin -->
                                <button v-if="isSuperAdmin"
                                        @click="toggleSuperAdmin(player, false)"
                                        :disabled="saving === player.firebaseUid"
                                        title="Revoke superadmin"
                                        class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                    <i class="ph-bold ph-shield-slash text-lg"></i>
                                </button>
                            </template>

                            <!-- Admin player row -->
                            <template v-else-if="getRole(player.firebaseUid!) === 'admin'">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 bg-indigo-900/40 text-indigo-300 border-indigo-500/50">
                                    Admin
                                </span>
                                <!-- Demote back to player -->
                                <button @click="toggleAdmin(player, false)"
                                        :disabled="saving === player.firebaseUid"
                                        title="Revoke admin"
                                        class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                    <i class="ph-bold ph-shield-slash text-lg"></i>
                                </button>
                                <!-- Only superadmins can promote to superadmin -->
                                <button v-if="isSuperAdmin"
                                        @click="toggleSuperAdmin(player, true)"
                                        :disabled="saving === player.firebaseUid"
                                        title="Promote to superadmin"
                                        class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-amber-500/10 hover:text-amber-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                    <i class="ph-bold ph-shield-plus text-lg"></i>
                                </button>
                            </template>

                            <!-- Player / tournament_creator row -->
                            <template v-else>
                                <!-- Tournament creator toggle -->
                                <label class="flex items-center gap-2 cursor-pointer flex-shrink-0"
                                       :class="saving === player.firebaseUid ? 'opacity-50 pointer-events-none' : ''">
                                    <div class="relative">
                                        <input type="checkbox"
                                               class="sr-only peer"
                                               :checked="getRole(player.firebaseUid!) === 'tournament_creator'"
                                               @change="toggleCreator(player, ($event.target as HTMLInputElement).checked)" />
                                        <div class="w-9 h-5 bg-slate-700 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                                        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <span class="text-xs text-slate-400 w-20">{{ getRole(player.firebaseUid!) === 'tournament_creator' ? 'Official creator' : 'Player' }}</span>
                                </label>
                                <!-- Promote to admin -->
                                <button v-if="can('promote_to_admin')"
                                        @click="toggleAdmin(player, true)"
                                        :disabled="saving === player.firebaseUid"
                                        title="Promote to admin"
                                        class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                    <i class="ph-bold ph-shield-check text-lg"></i>
                                </button>
                                <!-- Promote to superadmin (superadmin only) -->
                                <button v-if="isSuperAdmin"
                                        @click="toggleSuperAdmin(player, true)"
                                        :disabled="saving === player.firebaseUid"
                                        title="Promote to superadmin"
                                        class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-amber-500/10 hover:text-amber-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                    <i class="ph-bold ph-shield-plus text-lg"></i>
                                </button>
                            </template>

                            <button @click="openProfile(player)"
                                    title="View Profile"
                                    class="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex-shrink-0">
                                <i class="ph-bold ph-user-circle text-lg"></i>
                            </button>

                            <!-- Unlink: superadmin only -->
                            <button v-if="can('unlink_player')"
                                    @click="handleUnlink(player)"
                                    :disabled="unlinking === player.id"
                                    title="Unlink Discord account from player"
                                    class="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                                <i class="ph-bold ph-link-break text-lg"></i>
                            </button>

                            <i v-if="saving === player.firebaseUid || unlinking === player.id"
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
