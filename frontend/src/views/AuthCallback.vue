<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { signInWithCustomToken, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { APP_ID } from '../config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      error.value = 'No login token received.';
      loading.value = false;
      return;
    }

    // Sign in with the custom token from our Cloud Function
    const cred = await signInWithCustomToken(auth, token);
    const uid = cred.user.uid;

    // Extract Discord info from custom claims
    const claims = await cred.user.getIdTokenResult();
    const discordId = claims.claims.discordId as string | undefined;
    const displayName = claims.claims.displayName as string | undefined;
    const photoURL = cred.user.photoURL || claims.claims.photoURL as string | undefined;

    if (discordId) {
      // Find or link player with this Discord ID
      const playersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'players');
      const q = query(playersRef, where('discordId', '==', discordId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Link player to this Firebase account
        const playerDoc = snap.docs[0];
        if (playerDoc) {
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'players', playerDoc.id), {
            firebaseUid: uid,
            ...(photoURL ? { avatarUrl: photoURL } : {}),
          });
        }
      } else {
        // No player exists yet - user needs to create one via the modal
        // Just update the user profile
        if (displayName) {
          await updateProfile(auth.currentUser!, {
            displayName,
            ...(photoURL ? { photoURL } : {}),
          });
        }
      }
    }

    // Redirect to home
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
