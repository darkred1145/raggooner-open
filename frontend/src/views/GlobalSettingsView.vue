<script setup lang="ts">
import { ref, watch } from 'vue';
import type { GlobalSettings } from '../types';
import { useGlobalSettings, DEFAULT_GLOBAL_SETTINGS } from '../composables/useGlobalSettings';
import { ANNOUNCEMENT_PLACEHOLDERS } from '../utils/announcementUtils';
import { TOURNAMENT_FORMATS } from '../utils/constants';
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';

const { settings, loading, save } = useGlobalSettings();

// Local editable copy
const draft = ref<GlobalSettings>(JSON.parse(JSON.stringify(settings.value)));
const saving = ref(false);
const saveMessage = ref('');

// Sync draft when settings first load from Firestore
const stopWatch = watch(loading, (isLoading) => {
    if (!isLoading) {
        draft.value = JSON.parse(JSON.stringify(settings.value));
        stopWatch();
    }
});

const positions = Array.from({ length: 18 }, (_, i) => i + 1);

const handleSave = async () => {
    saving.value = true;
    saveMessage.value = '';
    try {
        await save(draft.value);
        saveMessage.value = 'Settings saved.';
        setTimeout(() => { saveMessage.value = ''; }, 3000);
    } catch (e) {
        saveMessage.value = 'Failed to save. Please try again.';
        console.error(e);
    } finally {
        saving.value = false;
    }
};

const resetToDefaults = () => {
    draft.value = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
};

const copiedPlaceholder = ref('');
const copyPlaceholder = async (placeholder: string) => {
    await navigator.clipboard.writeText(placeholder);
    copiedPlaceholder.value = placeholder;
    setTimeout(() => { copiedPlaceholder.value = ''; }, 1500);
};
</script>

<template>
    <div class="w-full flex flex-col min-h-full">
        <SiteHeader />

        <main class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div class="max-w-3xl mx-auto">
                <SiteNav />

                <div v-if="loading" class="text-center py-20">
                    <i class="ph ph-spinner animate-spin text-4xl text-indigo-500"></i>
                </div>

                <div v-else class="space-y-8">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-extrabold text-white">Global Settings</h1>
                            <p class="text-slate-400 text-sm mt-1">Default values applied to all new tournaments.</p>
                            <p class="text-amber-400/80 text-xs mt-2 flex items-center gap-1.5">
                                <i class="ph-fill ph-warning shrink-0"></i>
                                Changes only affect tournaments created after saving. Existing tournaments are not updated.
                            </p>
                        </div>
                        <button
                            @click="resetToDefaults"
                            class="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Reset to defaults
                        </button>
                    </div>

                    <!-- Tournament Defaults -->
                    <section class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-5">
                        <h2 class="text-lg font-bold text-white">Tournament Defaults</h2>

                        <!-- Default Format -->
                        <div>
                            <label class="text-sm font-medium text-slate-300 mb-2 block">Default Format</label>
                            <div class="flex gap-2">
                                <button
                                    v-for="(fmt, key) in TOURNAMENT_FORMATS"
                                    :key="key"
                                    @click="draft.defaultFormat = key"
                                    class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                                    :class="draft.defaultFormat === key
                                        ? 'border-indigo-500 bg-indigo-900/30'
                                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'"
                                >
                                    <div class="text-sm font-bold" :class="draft.defaultFormat === key ? 'text-indigo-300' : 'text-slate-300'">{{ fmt.name }}</div>
                                    <div class="text-[10px] mt-0.5" :class="draft.defaultFormat === key ? 'text-indigo-400/70' : 'text-slate-500'">{{ fmt.description }}</div>
                                </button>
                            </div>
                        </div>

                        <!-- Toggle settings -->
                        <div class="grid sm:grid-cols-3 gap-3">
                            <div
                                v-for="item in [
                                    { key: 'defaultSelfSignupEnabled', label: 'Self-Signup', desc: 'Players can register themselves' },
                                    { key: 'defaultCaptainActionsEnabled', label: 'Captain Actions', desc: 'Captains can submit race results' },
                                    { key: 'defaultUsePlacementTiebreaker', label: 'Placement Tiebreaker', desc: 'Use placement to break point ties' },
                                ]"
                                :key="item.key"
                                @click="(draft as any)[item.key] = !(draft as any)[item.key]"
                                class="cursor-pointer p-3 rounded-xl border-2 transition-all select-none"
                                :class="(draft as any)[item.key]
                                    ? 'border-emerald-500/60 bg-emerald-900/20'
                                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'"
                            >
                                <div class="flex items-center justify-between gap-2 mb-1">
                                    <span class="text-sm font-bold" :class="(draft as any)[item.key] ? 'text-emerald-300' : 'text-slate-400'">
                                        {{ item.label }}
                                    </span>
                                    <i
                                        class="text-lg"
                                        :class="(draft as any)[item.key]
                                            ? 'ph-fill ph-toggle-right text-emerald-400'
                                            : 'ph ph-toggle-left text-slate-600'"
                                    ></i>
                                </div>
                                <p class="text-[11px] text-slate-500">{{ item.desc }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- Points System -->
                    <section class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                        <h2 class="text-lg font-bold text-white mb-4">Default Points System</h2>
                        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <div v-for="pos in positions" :key="pos" class="flex flex-col items-center gap-1">
                                <label class="text-[10px] text-slate-500 font-mono">P{{ pos }}</label>
                                <input
                                    type="number"
                                    min="0"
                                    :value="draft.pointsSystem[pos] ?? 0"
                                    @input="draft.pointsSystem[pos] = Number(($event.target as HTMLInputElement).value)"
                                    class="w-full text-center bg-slate-900 border border-slate-700 rounded-lg py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Announcement Templates -->
                    <section class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-5">
                        <div>
                            <h2 class="text-lg font-bold text-white">Announcement Templates</h2>
                            <p class="text-xs text-slate-500 mt-1">Full announcement text sent to Discord. Use placeholders for dynamic values — click any placeholder to copy it.</p>
                        </div>

                        <!-- Placeholder legend -->
                        <div class="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2">
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Available Placeholders</p>
                            <div class="flex flex-col gap-2">
                                <div
                                    v-for="p in ANNOUNCEMENT_PLACEHOLDERS"
                                    :key="p.placeholder"
                                    @click="copyPlaceholder(p.placeholder)"
                                    class="flex items-start gap-3 cursor-pointer group"
                                >
                                    <code
                                        class="shrink-0 text-xs px-2 py-0.5 rounded-md border font-mono transition-colors"
                                        :class="copiedPlaceholder === p.placeholder
                                            ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                                            : 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300 group-hover:border-indigo-400/60 group-hover:bg-indigo-900/50'"
                                    >
                                        {{ copiedPlaceholder === p.placeholder ? '✓ copied' : p.placeholder }}
                                    </code>
                                    <span class="text-xs text-slate-400 leading-5">{{ p.description }}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-slate-300 mb-2 block">
                                <i class="ph-fill ph-git-branch mr-1 text-indigo-400"></i>Draft Pick Template
                            </label>
                            <textarea
                                v-model="draft.announcementTemplate.umaDraft"
                                rows="18"
                                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
                            ></textarea>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-slate-300 mb-2 block">
                                <i class="ph-fill ph-prohibit mr-1 text-rose-400"></i>Blind Pick Template
                            </label>
                            <textarea
                                v-model="draft.announcementTemplate.umaBan"
                                rows="20"
                                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono leading-relaxed focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
                            ></textarea>
                        </div>
                    </section>

                    <!-- Save -->
                    <div class="flex items-center gap-4 pb-12">
                        <button
                            @click="handleSave"
                            :disabled="saving"
                            class="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
                        >
                            <i v-if="saving" class="ph ph-spinner animate-spin"></i>
                            <i v-else class="ph-bold ph-floppy-disk"></i>
                            {{ saving ? 'Saving…' : 'Save Settings' }}
                        </button>
                        <span v-if="saveMessage" class="text-sm" :class="saveMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'">
                            {{ saveMessage }}
                        </span>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
