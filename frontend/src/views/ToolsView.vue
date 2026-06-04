<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import TrackRollerView from './tools/TrackRollerView.vue';
import UmaRollerView from './tools/UmaRollerView.vue';
import ReplayViewer from './ReplayViewer.vue';
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';

type ToolTab = 'track-roller' | 'uma-roller' | 'replay-viewer';
const route = useRoute();
const activeTab = ref<ToolTab>(route.query.id ? 'replay-viewer' : 'track-roller');
</script>

<template>
    <div class="w-full flex flex-col min-h-full">
        <SiteHeader />

        <main class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
            <SiteNav />
            <!-- Tab switcher -->
            <div class="flex justify-center mb-6">
                <div class="flex bg-slate-900 rounded-lg border border-slate-700 p-0.5">
                    <button @click="activeTab = 'track-roller'"
                            class="px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                            :class="activeTab === 'track-roller'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white'">
                        <i class="ph-fill ph-map-trifold"></i>
                        Track Roller
                    </button>
                    <button @click="activeTab = 'uma-roller'"
                            class="px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                            :class="activeTab === 'uma-roller'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white'">
                        <i class="ph-fill ph-horse"></i>
                        Uma Roller
                    </button>
                    <button @click="activeTab = 'replay-viewer'"
                            class="px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                            :class="activeTab === 'replay-viewer'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-white'">
                        <i class="ph-fill ph-play-circle"></i>
                        Race Replay
                    </button>
                </div>
            </div>

            <TrackRollerView v-if="activeTab === 'track-roller'" />
            <UmaRollerView v-else-if="activeTab === 'uma-roller'" />
            <ReplayViewer v-else-if="activeTab === 'replay-viewer'" :standalone="false" />
        </main>
    </div>
</template>
