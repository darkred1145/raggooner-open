<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { ref, computed } from 'vue';
import { useAuth } from '../composables/useAuth';
import { getFilteredUmas, getUmaImagePath } from '../utils/umaData';
import {
    SUPPORT_CARD_LIST,
    SUPPORT_CARD_DICT,
    SUPPORT_CARD_TYPE_META,
    getSupportCardDisplayName,
    getSupportCardDisplayTitle,
    matchesSupportCardSearch,
    resolveCardData,
} from '../utils/supportCardData';
import type { ProfileSupportCard } from '../types';
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';
import PlayerAvatar from '../components/shared/PlayerAvatar.vue';
import { useSignupNotifications } from '../composables/useSignupNotifications';

const { user, linkedPlayer, updatePlayerProfile, unlinkOwnAccount } = useAuth();
const {
    browserNotificationSupported,
    browserPermission,
    allOfficialSignups,
    watchedOfficialTournaments,
    watchedOpenSignupTournaments,
    requestBrowserPermission,
    toggleAllOfficialSignups,
    toggleTournamentWatch,
} = useSignupNotifications();
const showUnlinkConfirm = ref(false);
const unlinking = ref(false);

const confirmUnlink = async () => {
    unlinking.value = true;
    try {
        await unlinkOwnAccount();
        showUnlinkConfirm.value = false;
    } finally {
        unlinking.value = false;
    }
};

const getSupportCardImagePath = (cardId: string): string => {
    const numericId = cardId.split('-')[0];
    return `https://gametora.com/images/umamusume/supports/tex_support_card_${numericId}.png`;
};

// ── Uma Roster ────────────────────────────────────────────────────────────────

const umaSearch = ref('');
const savingRoster = ref(false);
const showUpcomingUmas = ref(false);

const filteredUmas = computed(() =>
    getFilteredUmas(showUpcomingUmas.value)
        .filter(u => u.name.toLowerCase().includes(umaSearch.value.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
);

const ownedUmas = computed<Set<string>>(() =>
    new Set(linkedPlayer.value?.roster ?? [])
);

const toggleUma = async (umaName: string) => {
    if (!linkedPlayer.value) return;
    savingRoster.value = true;
    const current = new Set(linkedPlayer.value.roster ?? []);
    if (current.has(umaName)) current.delete(umaName);
    else current.add(umaName);
    try {
        await updatePlayerProfile({ roster: [...current] });
    } finally {
        savingRoster.value = false;
    }
};

// ── Support Cards ─────────────────────────────────────────────────────────────

const savingCards = ref(false);
const selectedForEdit = ref<string | null>(null);
const cardSearch = ref('');

const ownedCards = computed<ProfileSupportCard[]>(() =>
    linkedPlayer.value?.supportCards ?? []
);

const filteredOwnedCards = computed(() => {
    const q = cardSearch.value.toLowerCase();
    return ownedCards.value
        .filter(c => {
            const meta = resolveCardData(c.cardId);
            if (!meta) return false;
            return matchesSupportCardSearch(c.cardId, q);
        })
        .sort((a, b) => {
            const ca = resolveCardData(a.cardId);
            const cb = resolveCardData(b.cardId);
            if (!ca || !cb) return 0;
            if (ca.type !== cb.type) return ca.type.localeCompare(cb.type);
            return ca.name.localeCompare(cb.name);
        });
});

const addCardSearch = ref('');

const filteredAddableCards = computed(() => {
    const ownedIds = new Set(ownedCards.value.map(c => c.cardId));
    const query = addCardSearch.value.toLowerCase();
    return SUPPORT_CARD_LIST
        .filter(c => !ownedIds.has(c.id) &&
                    (addCardTypeFilter.value === 'all' || c.type === addCardTypeFilter.value) &&
                    (addCardRarityFilter.value === 'all' || c.rarity === addCardRarityFilter.value) &&
                    matchesSupportCardSearch(c.id, query))
        .sort((a, b) => a.name.localeCompare(b.name));
});

const showAddCard = ref(false);
const addCardId = ref('');
const addCardLb = ref(0);
const addCardTypeFilter = ref('all');
const addCardRarityFilter = ref('all');

const openAddCard = () => {
    addCardId.value = '';
    addCardLb.value = 0;
    addCardSearch.value = '';
    addCardTypeFilter.value = 'all';
    addCardRarityFilter.value = 'all';
    showAddCard.value = true;
};

const selectAddableCard = (cardId: string) => {
    addCardId.value = cardId;
};

const confirmAddCard = async () => {
    if (!addCardId.value || !linkedPlayer.value) return;
    savingCards.value = true;
    const updated: ProfileSupportCard[] = [
        ...ownedCards.value,
        { cardId: addCardId.value, limitBreak: addCardLb.value },
    ];
    try {
        await updatePlayerProfile({ supportCards: updated });
        showAddCard.value = false;
    } finally {
        savingCards.value = false;
    }
};

const removeCard = async (cardId: string) => {
    if (!linkedPlayer.value) return;
    savingCards.value = true;
    const updated = ownedCards.value.filter(c => c.cardId !== cardId);
    try {
        await updatePlayerProfile({ supportCards: updated });
    } finally {
        savingCards.value = false;
    }
};

const updateLimitBreak = async (cardId: string, lb: number) => {
    if (!linkedPlayer.value) return;
    savingCards.value = true;
    const updated = ownedCards.value.map(c =>
        c.cardId === cardId ? { ...c, limitBreak: lb } : c
    );
    try {
        await updatePlayerProfile({ supportCards: updated });
    } finally {
        savingCards.value = false;
    }
};

const unknownCards = computed(() =>
    ownedCards.value.filter(c => !SUPPORT_CARD_DICT[c.cardId])
);


</script>

<template>
    <div v-bind="$attrs" class="w-full flex flex-col">
    <SiteHeader />
    <div class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <SiteNav />
    </div>
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 pb-6">

        <!-- Not logged in -->
        <div v-if="!user" class="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <i class="ph-fill ph-discord-logo text-5xl text-[#5865F2] mb-4"></i>
            <p class="text-slate-400">Login with Discord to view your profile.</p>
        </div>

        <!-- Logged in but not linked -->
        <div v-else-if="!linkedPlayer" class="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <i class="ph-bold ph-link-break text-5xl text-slate-600 mb-4"></i>
            <p class="text-slate-400">Link your account to a player first.</p>
        </div>

        <!-- Full profile -->
        <template v-else>

            <!-- Header card -->
            <div class="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 flex items-center gap-5">
                <PlayerAvatar
                    :name="linkedPlayer.name"
                    :avatar-url="linkedPlayer.avatarUrl ?? user.photoURL"
                    size="xl"
                    class="border-2 border-slate-600"
                />
                <div class="flex-1 min-w-0">
                    <div class="text-xl font-bold text-white">{{ linkedPlayer.name }}</div>
                    <div class="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <i class="ph-fill ph-discord-logo text-[#5865F2]"></i>
                        {{ user.displayName }}
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        <span><span class="text-white font-bold">{{ linkedPlayer?.metadata?.totalTournaments ?? 0 }}</span> tournaments</span>
                        <span><span class="text-white font-bold">{{ linkedPlayer?.metadata?.totalRaces ?? 0 }}</span> races</span>
                        <span><span class="inline-block min-w-[2ch] text-right tabular-nums text-white font-bold">{{ linkedPlayer.roster?.length ?? 0 }}</span> umas</span>
                        <span><span class="text-white font-bold">{{ linkedPlayer.supportCards?.length ?? 0 }}</span> support cards</span>
                    </div>
                </div>
                <button @click="showUnlinkConfirm = true"
                        title="Unlink Discord account from player"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-700 rounded-lg hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/5 transition-colors shrink-0">
                    <i class="ph-bold ph-link-break"></i>
                    Unlink
                </button>
            </div>

            <!-- Signup Notifications -->
            <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
                <div class="px-5 py-4 border-b border-slate-700 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="font-bold text-white uppercase tracking-wider text-sm">Signup Notifications</h2>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Watch official tournaments and get browser alerts when self-signups open.
                        </p>
                    </div>
                    <button
                        v-if="browserNotificationSupported && browserPermission !== 'granted'"
                        @click="requestBrowserPermission"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                        {{ browserPermission === 'denied' ? 'Notifications Blocked' : 'Enable Browser Alerts' }}
                    </button>
                </div>

                <div class="p-5 space-y-4">
                    <div class="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-4">
                        <div>
                            <div class="text-sm font-bold text-white">All Official Tournaments</div>
                            <div class="text-xs text-slate-500 mt-1">
                                Automatically watch every active official event.
                            </div>
                        </div>
                        <button
                            @click="toggleAllOfficialSignups"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                            :class="allOfficialSignups ? 'bg-indigo-600' : 'bg-slate-700'"
                        >
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                                  :class="allOfficialSignups ? 'translate-x-6' : 'translate-x-1'"/>
                        </button>
                    </div>

                    <div class="grid md:grid-cols-2 gap-3 text-sm">
                        <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                            <div class="text-2xl font-black text-emerald-300">{{ watchedOpenSignupTournaments.length }}</div>
                            <div class="text-xs uppercase tracking-wider text-emerald-200/80 mt-1">Watched and Open</div>
                        </div>
                        <div class="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                            <div class="text-2xl font-black text-white">{{ watchedOfficialTournaments.length }}</div>
                            <div class="text-xs uppercase tracking-wider text-slate-400 mt-1">Currently Watched</div>
                        </div>
                    </div>

                    <div v-if="watchedOfficialTournaments.length > 0" class="space-y-2">
                        <div class="text-xs font-bold uppercase tracking-wider text-slate-500">Watched Official Tournaments</div>
                        <div class="grid gap-2">
                            <div v-for="tournament in watchedOfficialTournaments" :key="tournament.id"
                                 class="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3">
                                <div class="min-w-0">
                                    <div class="font-bold text-white truncate">{{ tournament.name }}</div>
                                    <div class="text-xs text-slate-500 mt-1 font-mono">{{ tournament.id }}</div>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                          :class="tournament.selfSignupEnabled
                                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                            : 'border-slate-700 bg-slate-800 text-slate-400'">
                                        {{ tournament.selfSignupEnabled ? 'Open' : 'Closed' }}
                                    </span>
                                    <button
                                        v-if="!allOfficialSignups"
                                        @click="toggleTournamentWatch(tournament.id)"
                                        class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                    >
                                        Unwatch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
                        No watched official tournaments yet. Use the bell on an official tournament page to follow one.
                    </div>
                </div>
            </div>

            <!-- ── Uma Roster ─────────────────────────────────────────── -->
            <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
                <div class="px-5 py-4 border-b border-slate-700 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="font-bold text-white uppercase tracking-wider text-sm">Uma Roster</h2>
                        <p class="text-xs text-slate-500 mt-0.5"><span class="inline-block min-w-[2ch] text-right tabular-nums">{{ ownedUmas.size }}</span> / {{ filteredUmas.length }} umas shown</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1.5 cursor-pointer shrink-0">
                            <input type="checkbox" v-model="showUpcomingUmas" class="accent-indigo-500 w-3.5 h-3.5 cursor-pointer" />
                            <span class="text-xs text-slate-400">Upcoming</span>
                        </label>
                        <input
                            v-model="umaSearch"
                            placeholder="Search…"
                            class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
                        />
                    </div>
                </div>

                <div class="p-4 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                    <button
                        v-for="uma in filteredUmas"
                        :key="uma.id"
                        @click="toggleUma(uma.name)"
                        :disabled="savingRoster"
                        class="relative rounded-lg overflow-hidden border-2 transition-[border-color,box-shadow,opacity] duration-150 group"
                        :class="ownedUmas.has(uma.name)
                            ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                            : 'border-slate-700 opacity-40 hover:opacity-70 hover:border-slate-500'"
                    >
                        <img
                            :src="getUmaImagePath(uma.name)"
                            :alt="uma.name"
                            class="w-full aspect-square object-cover object-top bg-slate-700"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                        <div class="absolute bottom-0 left-0 right-0 px-1 pb-1">
                            <p class="text-[9px] text-white font-bold leading-tight truncate text-center drop-shadow">{{ uma.name }}</p>
                        </div>
                        <!-- Owned checkmark -->
                        <div v-if="ownedUmas.has(uma.name)" class="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow">
                            <i class="ph-bold ph-check text-[8px] text-white"></i>
                        </div>
                    </button>
                </div>
            </div>

            <!-- ── Support Cards ──────────────────────────────────────── -->
            <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
                <div class="px-5 py-4 border-b border-slate-700 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="font-bold text-white uppercase tracking-wider text-sm">Support Cards</h2>
                        <p class="text-xs text-slate-500 mt-0.5"><span class="inline-block min-w-[2ch] text-right tabular-nums">{{ filteredOwnedCards.length }}</span> cards owned</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <input
                            v-model="cardSearch"
                            placeholder="Search character or title…"
                            class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
                        />
                        <button
                            v-if="!showAddCard"
                            @click="openAddCard"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                        >
                            <i class="ph-bold ph-plus"></i>
                            Add
                        </button>
                    </div>
                </div>

                <!-- Add card form -->
                <div v-if="showAddCard" class="px-5 py-4 border-b border-slate-700 bg-slate-900/50">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-bold text-white">Add Support Card</h3>
                        <button @click="showAddCard = false"
                                class="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors"
                                title="Close">
                            <i class="ph-bold ph-x text-sm"></i>
                        </button>
                    </div>
                    <!-- Search -->
                    <input
                        v-model="addCardSearch"
                        placeholder="Search character or title…"
                        class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-3"
                    />

                    <!-- Type filter -->
                    <div class="flex flex-wrap gap-1.5 mb-2">
                        <button v-for="[key, meta] in Object.entries(SUPPORT_CARD_TYPE_META)" :key="key"
                                @click="addCardTypeFilter = key"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardTypeFilter === key
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            {{ meta.label }}
                        </button>
                        <button @click="addCardTypeFilter = 'all'"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardTypeFilter === 'all'
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            All
                        </button>
                    </div>

                    <!-- Rarity filter -->
                    <div class="flex flex-wrap gap-1.5 mb-3">
                        <button @click="addCardRarityFilter = 'SSR'"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardRarityFilter === 'SSR'
                                    ? 'bg-amber-600 border-amber-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            SSR
                        </button>
                        <button @click="addCardRarityFilter = 'SR'"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardRarityFilter === 'SR'
                                    ? 'bg-amber-600 border-amber-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            SR
                        </button>
                        <button @click="addCardRarityFilter = 'R'"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardRarityFilter === 'R'
                                    ? 'bg-amber-600 border-amber-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            R
                        </button>
                        <button @click="addCardRarityFilter = 'all'"
                                class="px-2 py-1 rounded text-[10px] font-bold border transition-colors"
                                :class="addCardRarityFilter === 'all'
                                    ? 'bg-amber-600 border-amber-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'">
                            All
                        </button>
                    </div>

                    <!-- Card picker grid -->
                    <div v-if="filteredAddableCards.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-3 max-h-80 overflow-y-auto mb-4">
                        <div v-for="card in filteredAddableCards" :key="card.id"
                             class="relative rounded-lg overflow-hidden border-2 transition-[border-color,box-shadow,opacity] duration-150 cursor-pointer"
                             :class="addCardId === card.id
                                 ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                                 : 'border-slate-700 opacity-60 hover:opacity-90 hover:border-slate-500'"
                             @click="selectAddableCard(card.id)">
                            <img :src="getSupportCardImagePath(card.id)"
                                 :alt="card.name"
                                 class="w-full aspect-[2/3] object-cover bg-slate-800" />
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent"></div>
                            <!-- Type badge -->
                            <span class="absolute top-1 left-1 rounded-md border border-slate-950/70 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-bold shadow-sm backdrop-blur-sm"
                                  :class="[SUPPORT_CARD_TYPE_META[card.type].color, SUPPORT_CARD_TYPE_META[card.type].bg]">
                                {{ SUPPORT_CARD_TYPE_META[card.type].label }}
                            </span>
                            <span class="absolute top-1 right-1 text-[8px] font-bold text-slate-300 bg-slate-900/60 px-1 py-0.5 rounded">{{ card.rarity }}</span>
                            <div class="absolute inset-x-0 bottom-0 border-t border-slate-700/50 bg-slate-950/88 px-1.5 pb-1.5 pt-1 backdrop-blur-sm">
                                <div class="space-y-0.5 text-center">
                                    <p
                                        class="truncate text-[10px] font-bold leading-tight text-white drop-shadow"
                                        :title="`${getSupportCardDisplayName(card.id)} - ${getSupportCardDisplayTitle(card.id)}`"
                                    >
                                        {{ getSupportCardDisplayName(card.id) }}
                                    </p>
                                    <p class="truncate text-[9px] leading-tight text-slate-300/90">
                                        {{ getSupportCardDisplayTitle(card.id) }}
                                    </p>
                                </div>
                            </div>
                            <!-- Selected checkmark -->
                            <div v-if="addCardId === card.id" class="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow">
                                <i class="ph-bold ph-check text-[8px] text-white"></i>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 text-slate-500 text-sm">
                        {{ addCardSearch ? 'No matching cards found.' : 'All available cards already owned.' }}
                        <div class="mt-3">
                            <button @click="showAddCard = false"
                                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                        </div>
                    </div>

                    <!-- Selected card & LB -->
                    <div v-if="addCardId && SUPPORT_CARD_DICT[addCardId]" class="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
                        <div class="relative rounded-lg overflow-hidden border-2 border-indigo-500 shadow-md shadow-indigo-500/20 shrink-0 w-16 h-24">
                            <img :src="getSupportCardImagePath(addCardId)"
                                 :alt="getSupportCardDisplayName(addCardId)"
                                 class="w-full h-full object-cover bg-slate-800" />
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent"></div>
                            <span class="absolute top-1 left-1 rounded-md border border-slate-950/70 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-bold shadow-sm backdrop-blur-sm"
                                  :class="[SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[addCardId]!.type].color, SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[addCardId]!.type].bg]">
                                {{ SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[addCardId]!.type].label }}
                            </span>
                            <div class="absolute inset-x-0 bottom-0 border-t border-slate-700/50 bg-slate-950/88 px-1.5 pb-1.5 pt-1 backdrop-blur-sm">
                                <div class="space-y-0.5 text-center">
                                    <p
                                        class="truncate text-[10px] font-bold leading-tight text-white drop-shadow"
                                        :title="`${getSupportCardDisplayName(addCardId)} - ${getSupportCardDisplayTitle(addCardId)}`"
                                    >
                                        {{ getSupportCardDisplayName(addCardId) }}
                                    </p>
                                    <p class="truncate text-[9px] leading-tight text-slate-300/90">
                                        {{ getSupportCardDisplayTitle(addCardId) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0 rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                            <div class="text-sm font-bold text-white leading-snug">{{ getSupportCardDisplayName(addCardId) }}</div>
                            <div class="mt-1 text-xs text-slate-400 leading-snug">{{ getSupportCardDisplayTitle(addCardId) }}</div>
                            <div class="mt-3">
                                <div class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Limit Break</div>
                                <div class="grid grid-cols-5 gap-1.5">
                                    <button v-for="lb in [0,1,2,3,4]" :key="lb"
                                        @click="addCardLb = lb"
                                        class="h-8 rounded-md text-[11px] font-bold border transition-colors"
                                        :class="addCardLb === lb
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'">
                                    {{ lb }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button @click="confirmAddCard" :disabled="savingCards || !addCardId"
                                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">Add</button>
                            <button @click="showAddCard = false"
                                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>

                <!-- Unknown cards warning -->
                <div v-if="unknownCards.length > 0" class="px-5 py-3 border-b border-amber-500/20 bg-amber-500/5">
                    <div class="text-xs text-amber-400 font-bold mb-2">
                        <i class="ph-bold ph-warning"></i> {{ unknownCards.length }} card(s) with outdated IDs
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <div v-for="entry in unknownCards" :key="entry.cardId"
                             class="flex items-center gap-2 bg-slate-800 border border-amber-500/30 rounded-lg px-3 py-1.5">
                            <span class="text-xs text-slate-500 font-mono truncate max-w-[120px]">{{ entry.cardId }}</span>
                            <span class="text-xs text-slate-600">LB:{{ entry.limitBreak }}</span>
                            <button @click="removeCard(entry.cardId)" :disabled="savingCards"
                                    class="text-amber-400 hover:text-red-400 transition-colors shrink-0"
                                    title="Remove outdated card">
                                <i class="ph-bold ph-x"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Card grid -->
                <div v-if="filteredOwnedCards.length > 0" class="p-4 grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
                    <template v-for="entry in filteredOwnedCards" :key="entry.cardId">
                        <div v-if="SUPPORT_CARD_DICT[entry.cardId]"
                             class="relative rounded-lg overflow-hidden border-2 transition-[border-color,box-shadow,opacity] duration-150 cursor-pointer"
                             :class="'border-indigo-500 shadow-md shadow-indigo-500/20'"
                             @click="selectedForEdit = entry.cardId">
                            <img
                                :src="getSupportCardImagePath(entry.cardId)"
                                :alt="getSupportCardDisplayName(entry.cardId)"
                                class="w-full aspect-[2/3] object-cover bg-slate-800"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent"></div>
                            <!-- Type badge -->
                            <span class="absolute top-1 left-1 rounded-md border border-slate-950/70 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-bold shadow-sm backdrop-blur-sm"
                                  :class="[SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[entry.cardId]!.type].color, SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[entry.cardId]!.type].bg]">
                                {{ SUPPORT_CARD_TYPE_META[SUPPORT_CARD_DICT[entry.cardId]!.type].label }}
                            </span>
                            <!-- Rarity -->
                            <span class="absolute top-1 right-1 text-[8px] font-bold text-slate-300 bg-slate-900/60 px-1 py-0.5 rounded">
                                {{ SUPPORT_CARD_DICT[entry.cardId]!.rarity }}
                            </span>
                            <div class="absolute inset-x-0 bottom-0 border-t border-slate-700/50 bg-slate-950/88 px-1.5 pb-1.5 pt-1 backdrop-blur-sm">
                                <!-- LB dots -->
                                <div class="mb-1 flex justify-center gap-0.5">
                                    <div v-for="i in 4" :key="i"
                                         class="h-1.5 w-1.5 rounded-full"
                                         :class="i <= entry.limitBreak ? 'bg-indigo-400' : 'bg-slate-600/80'"></div>
                                </div>
                                <div class="space-y-0.5 text-center">
                                    <p
                                        class="truncate text-[10px] font-bold leading-tight text-white drop-shadow"
                                        :title="`${getSupportCardDisplayName(entry.cardId)} - ${getSupportCardDisplayTitle(entry.cardId)}`"
                                    >
                                        {{ getSupportCardDisplayName(entry.cardId) }}
                                    </p>
                                    <p class="truncate text-[9px] leading-tight text-slate-300/90">
                                        {{ getSupportCardDisplayTitle(entry.cardId) }}
                                    </p>
                                </div>
                            </div>
                            <!-- LB selector overlay (on click) -->
                            <div v-if="selectedForEdit === entry.cardId"
                                 class="absolute inset-0 bg-slate-900/96 flex flex-col justify-between gap-2 p-2.5">
                                <div class="space-y-1">
                                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-300 text-center">Limit Break</p>
                                    <p class="text-[9px] text-slate-500 text-center">{{ getSupportCardDisplayName(entry.cardId) }}</p>
                                </div>
                                <div class="grid grid-cols-5 gap-1">
                                    <button v-for="lb in [0,1,2,3,4]" :key="lb"
                                            @click.stop="updateLimitBreak(entry.cardId, lb)"
                                            :disabled="savingCards"
                                            class="h-8 rounded-md text-[11px] font-bold border transition-colors"
                                            :class="entry.limitBreak === lb
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'">
                                        {{ lb }}
                                    </button>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <button @click.stop="removeCard(entry.cardId)" :disabled="savingCards"
                                            class="flex items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-2 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/20">
                                        <i class="ph-bold ph-trash"></i>
                                        Remove
                                    </button>
                                    <button @click.stop="selectedForEdit = null"
                                            class="flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-[10px] font-bold text-slate-300 transition-colors hover:bg-slate-700">
                                        <i class="ph-bold ph-x"></i>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <div v-else-if="!showAddCard" class="px-5 py-10 text-center text-slate-600 text-sm">
                    No support cards added yet.
                </div>
            </div>

        </template>
    </div>
    </div>

    <!-- Unlink confirmation modal -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showUnlinkConfirm"
                 class="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showUnlinkConfirm = false"></div>
                <div class="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
                    <div class="flex items-start gap-4 mb-5">
                        <div class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                            <i class="ph-bold ph-link-break text-red-400 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-base">Unlink account?</h3>
                            <p class="text-sm text-slate-400 mt-1">
                                Your Discord account will be disconnected from <span class="text-white font-semibold">{{ linkedPlayer?.name }}</span>.
                                Your tournament history and stats are preserved — you'll just need to link to a player again.
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-end">
                        <button @click="showUnlinkConfirm = false"
                                :disabled="unlinking"
                                class="px-4 py-2 text-sm font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button @click="confirmUnlink"
                                :disabled="unlinking"
                                class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                            <i v-if="unlinking" class="ph ph-spinner animate-spin"></i>
                            <i v-else class="ph-bold ph-link-break"></i>
                            Unlink
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s, transform 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }
</style>
