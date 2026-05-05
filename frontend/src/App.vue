<script setup lang="ts">
import { onMounted, ref, provide } from 'vue';
import type { Tournament } from './types';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import { APP_VERSION } from './data/changelog';
import ChangelogModal from './components/ChangelogModal.vue';
import SuperAdminPanel from "./components/admin/SuperAdminPanel.vue";
import DiscordAuthModal from "./components/auth/DiscordAuthModal.vue";
import { useAuth, checkDiscordSession } from './composables/useAuth';
import { useSignupNotifications } from './composables/useSignupNotifications';
import { useUserRoles } from './composables/useUserRoles';

// Load Discord session BEFORE useAuth so it's available when auth state fires
checkDiscordSession();

const { user, linkedPlayer, loading: authLoading, isDiscordUser } = useAuth();
const { initializeSignupNotifications } = useSignupNotifications();
const { isSuperAdmin } = useUserRoles();

const showChangelog = ref(false);
const hasNewUpdates = ref(false);
const previousVersion = ref('0.0.0');

const isPanelOpen = ref(false);

const init = async () => {
  await auth.authStateReady();

  const urlParams = new URLSearchParams(window.location.search);
  const initialToken = urlParams.get('token') || (window as any).__initial_auth_token;

  if (initialToken) {
    await signInWithCustomToken(auth, initialToken);
    // Clean URL
    urlParams.delete('token');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};

const openChangelog = () => {
  showChangelog.value = true;
  hasNewUpdates.value = false;
  localStorage.setItem('last_seen_version', APP_VERSION);
};

const closeChangelog = () => {
  showChangelog.value = false;
  previousVersion.value = APP_VERSION;
};

// Share these with ALL router views (so any header can open the changelog)
provide('openChangelog', openChangelog);
provide('hasNewUpdates', hasNewUpdates);

// Shared tournament ref — set by TournamentView, cleared by HomeView
const activeTournament = ref<Tournament | null>(null);
provide('activeTournament', activeTournament);

onMounted(() => {
  init();
  initializeSignupNotifications();
  const lastSeen = localStorage.getItem('last_seen_version');
  if (lastSeen) previousVersion.value = lastSeen;
  if (lastSeen !== APP_VERSION) hasNewUpdates.value = true;
});
</script>

<template>
  <div class="min-h-screen flex flex-col">


<!--          <SeasonSetup></SeasonSetup>-->
<!--          <Migrate></Migrate>-->

    <div v-if="isSuperAdmin"
         class="fixed left-0 top-1/2 -translate-y-1/2 z-[100] transition-transform duration-300"
         :class="isPanelOpen ? 'translate-x-80' : 'translate-x-0'">
      <button
          @click="isPanelOpen = !isPanelOpen"
          class="bg-cyber-glow/30 w-0.5 hover:bg-cyber-glow/60 text-white p-2 rounded-r-lg shadow-neon-cyan border-y border-r border-cyber-glow/40 flex items-center justify-center group">
        <i class="ph-bold ph-caret-right transition-transform duration-300 text-cyber-glow" :class="isPanelOpen ? 'rotate-180' : ''"></i>
      </button>
    </div>

    <SuperAdminPanel
        v-if="isSuperAdmin"
        :is-open="isPanelOpen"
        @close="isPanelOpen = false"
    />

    <router-view class="flex-grow flex flex-col"></router-view>

    <footer class="border-t border-cyber-border/40 bg-cyber-dark/80 py-8 mt-auto backdrop-blur-sm">
      <div class="max-w-[1800px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-xs font-mono text-slate-600 flex items-center gap-3 flex-wrap">
          <span>
            Powered by <span class="text-cyber-glow font-bold">Vue</span> & <span class="text-amber-500 font-bold">Firebase</span>
          </span>
          <span class="text-slate-700">|</span>
          <a href="https://github.com/darkred1145/raggooner-open" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-1 text-slate-500 hover:text-cyber-glow/70 transition-colors">
            <i class="ph-fill ph-github-logo text-base"></i>
            <span>Source</span>
          </a>
        </div>
        <div class="text-sm text-slate-400 flex items-center gap-4 flex-wrap">
          <span class="flex items-center gap-1.5">
            Original by
            <a href="https://discord.com/users/131446525585784832" target="_blank" rel="noopener noreferrer" class="font-bold text-cyber-purple hover:text-white transition-colors flex items-center gap-1.5 group">
              Sumpfranze <i class="ph-fill ph-discord-logo text-lg group-hover:scale-110 transition-transform"></i>
            </a>
          </span>
          <span class="text-slate-700">|</span>
          <span class="flex items-center gap-1.5">
            Fork by
            <a href="https://discord.com/users/925673287974027324" target="_blank" rel="noopener noreferrer" class="font-bold text-cyber-glow hover:text-white transition-colors flex items-center gap-1.5 group">
              Kenesu <i class="ph-fill ph-discord-logo text-lg group-hover:scale-110 transition-transform"></i>
            </a>
          </span>
        </div>
      </div>
    </footer>

    <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <ChangelogModal v-if="showChangelog" :last-seen-version="previousVersion" @close="closeChangelog" />
    </Transition>

    <DiscordAuthModal v-if="!authLoading && user && isDiscordUser && !linkedPlayer" />
  </div>
</template>
