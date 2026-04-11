import { ref, computed } from 'vue';
import {
    onAuthStateChanged,
    signInAnonymously,
    signOut,
    type User
} from 'firebase/auth';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteField,
    setDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { APP_ID } from '../config';
import type { GlobalPlayer } from '../types';

const appId = APP_ID;

const user = ref<User | null>(null);
const linkedPlayer = ref<GlobalPlayer | null>(null);
const loading = ref(true);
const loginError = ref<string | null>(null);

const fetchLinkedPlayerInternal = async (uid: string) => {
    try {
        const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
        const q = query(playersRef, where('firebaseUid', '==', uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docSnap = snap.docs[0];
            if (docSnap) {
                linkedPlayer.value = { id: docSnap.id, ...docSnap.data() } as GlobalPlayer;
            }
        } else {
            linkedPlayer.value = null;
        }
    } catch (e) {
        console.error('Error fetching linked player:', e);
        linkedPlayer.value = null;
    }
};

onAuthStateChanged(auth, async (u) => {
    user.value = u;
    if (u) {
        await fetchLinkedPlayerInternal(u.uid);
        // Sync avatar if Firebase Auth has a newer URL than what's stored in Firestore
        if (u.photoURL && linkedPlayer.value && linkedPlayer.value.avatarUrl !== u.photoURL) {
            const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', linkedPlayer.value.id);
            await updateDoc(playerRef, { avatarUrl: u.photoURL });
            linkedPlayer.value = { ...linkedPlayer.value, avatarUrl: u.photoURL };
        }
    } else {
        linkedPlayer.value = null;
    }
    loading.value = false;
});

export function useAuth() {
    const isDiscordUser = computed(() => {
        return user.value?.providerData.some(p => p.providerId === 'custom') ||
            !!(user.value && user.value.metadata?.creationTime);
    });

    const loginWithDiscord = async () => {
        loginError.value = null;

        // Get the Discord login URL (emulator vs production)
        const isLocalhost = window.location.hostname === 'localhost';
        const loginUrl = isLocalhost
            ? 'http://127.0.0.1:5001/raggooner-uma-2026/us-central1/discordLogin?action=start'
            : 'https://us-central1-raggooner-uma-2026.cloudfunctions.net/discordLogin?action=start';

        const state = Math.random().toString(36).substring(2);
        const fullUrl = `${loginUrl}&state=${state}`;

        const width = 500;
        const height = 700;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const popup = window.open(
            fullUrl,
            'discord-login',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`
        );

        if (!popup) {
            loginError.value = 'Popup blocked. Please allow popups for this site.';
            return;
        }

        // Poll for the popup to close, then check if auth state changed
        const pollInterval = setInterval(() => {
            try {
                if (popup?.closed) {
                    clearInterval(pollInterval);
                    // Auth state change will handle it
                }
            } catch {
                // Cross-origin, can't check — just keep polling
            }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            if (popup && !popup.closed) {
                popup.close();
                loginError.value = 'Login timed out. Please try again.';
            }
        }, 5 * 60 * 1000);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await signInAnonymously(auth);
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    const linkToPlayer = async (globalPlayer: GlobalPlayer) => {
        if (!user.value) throw new Error('Must be logged in to link a player');
        
        const discordProfile = user.value.providerData.find(p => p.providerId.includes('discord'));
        const discordId = discordProfile?.uid;

        try {
            const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', globalPlayer.id);
            const updateData: Partial<GlobalPlayer> = {
                firebaseUid: user.value.uid,
                discordId: discordId || undefined,
                avatarUrl: user.value.photoURL || undefined,
            };

            await updateDoc(playerRef, updateData);
            
            linkedPlayer.value = { 
                ...globalPlayer, 
                ...updateData 
            };
        } catch (e) {
            console.error('Failed to link player:', e);
            throw e;
        }
    };

    const createAndLinkPlayer = async (name: string) => {
        if (!user.value) throw new Error('Must be logged in to create a player');
        
        const discordProfile = user.value.providerData.find(p => p.providerId.includes('discord'));
        const discordId = discordProfile?.uid;
        const playerId = crypto.randomUUID();

        const newPlayer: GlobalPlayer = {
            id: playerId,
            name,
            createdAt: new Date().toISOString(),
            firebaseUid: user.value.uid,
            discordId: discordId || undefined,
            avatarUrl: user.value.photoURL || undefined,
            metadata: {
                totalTournaments: 0,
                totalRaces: 0
            }
        };

        try {
            const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId);
            await setDoc(playerRef, newPlayer);
            linkedPlayer.value = newPlayer;
            return newPlayer;
        } catch (e) {
            console.error('Failed to create and link player:', e);
            throw e;
        }
    };

    const unlinkOwnAccount = async () => {
        if (!linkedPlayer.value) throw new Error('No linked player');
        const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', linkedPlayer.value.id);
        await updateDoc(playerRef, {
            firebaseUid: deleteField(),
            discordId: deleteField(),
            avatarUrl: deleteField(),
        });
        linkedPlayer.value = null;
    };

    const updatePlayerProfile = async (fields: Partial<Pick<GlobalPlayer, 'roster' | 'supportCards'>>) => {
        if (!linkedPlayer.value) throw new Error('No linked player');
        const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', linkedPlayer.value.id);
        await updateDoc(playerRef, fields);
        linkedPlayer.value = { ...linkedPlayer.value, ...fields };
    };

    return {
        user,
        linkedPlayer,
        loading,
        loginError,
        isDiscordUser,
        loginWithDiscord,
        logout,
        linkToPlayer,
        createAndLinkPlayer,
        unlinkOwnAccount,
        updatePlayerProfile,
    };
}
