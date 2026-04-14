<script setup lang="ts">
import { ref, onMounted } from 'vue';

const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');
    const discordId = params.get('discordId');
    const displayName = params.get('displayName');
    const photoURL = params.get('photoURL') || undefined;

    // Always save discord_session regardless of token vs dev mode
    if (uid && discordId) {
      const session = { uid, discordId, displayName, photoURL, timestamp: Date.now() };
      localStorage.setItem('discord_session', JSON.stringify(session));
    }

    if (token) {
      // Production: sign in with custom token from Cloud Function
      const { signInWithCustomToken, setPersistence, browserLocalPersistence } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      await setPersistence(auth, browserLocalPersistence);
      await signInWithCustomToken(auth, token);
      window.location.href = '/';
      return;
    }

    if (!uid || !discordId) {
      throw new Error('No login info received.');
    }

    // Redirect to home — the app will pick up the session
    window.location.href = '/';
  } catch (e: any) {
    console.error('Auth callback error:', e);
    error.value = e?.message || 'Login failed. Please try again.';
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] flex items-center justify-center">
    <div class="text-center">
      <template v-if="loading">
        <i class="ph-bold ph-spinner animate-spin text-4xl text-indigo-400 mb-4"></i>
        <p class="text-slate-300">Logging you in...</p>
      </template>
      <template v-else>
        <i class="ph-bold ph-warning text-4xl text-rose-400 mb-4"></i>
        <p class="text-rose-300 mb-4">{{ error }}</p>
        <router-link to="/" class="text-indigo-400 hover:text-indigo-300 underline">
          Go home
        </router-link>
      </template>
    </div>
  </div>
</template>
