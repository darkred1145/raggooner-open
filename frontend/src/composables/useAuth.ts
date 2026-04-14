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

interface DiscordSession {
    uid: string;
    discordId: string;
    displayName?: string;
    photoURL?: string;
    timestamp: number;
}

const appId = APP_ID;
const DISCORD_SESSION_KEY = 'discord_session';

const user = ref<User | null>(null);
const linkedPlayer = ref<GlobalPlayer | null>(null);
const loading = ref(true);
const loginError = ref<string | null>(null);
const discordSession = ref<DiscordSession | null>(null);

function getStoredSession(): DiscordSession | null {
    try {
        const raw = localStorage.getItem(DISCORD_SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw) as DiscordSession;
        if (Date.now() - session.timestamp < 30 * 24 * 60 * 60 * 1000) {
            discordSession.value = session;
            return session;
        }
        localStorage.removeItem(DISCORD_SESSION_KEY);
    } catch {}
    return null;
}

function saveSession(session: DiscordSession | null) {
    discordSession.value = session;
    if (session) {
        localStorage.setItem(DISCORD_SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(DISCORD_SESSION_KEY);
    }
}

// Re-export for App.vue to call on each page load
export { getStoredSession as checkDiscordSession };

const fetchLinkedPlayerInternal = async (uid: string) => {
    try {
        const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
        let q: ReturnType<typeof query>;

        if (discordSession.value?.discordId) {
            q = query(playersRef, where('discordId', '==', discordSession.value.discordId));
        } else {
            q = query(playersRef, where('firebaseUid', '==', uid));
        }

        const snap = await getDocs(q);

        if (!snap.empty) {
            const d = snap.docs[0];
            if (d) {
                linkedPlayer.value = { id: d.id, ...d.data() as Record<string, unknown> } as GlobalPlayer;
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
    // If we have a Discord session (custom OAuth), merge its profile info into the user object
    // because the Firebase Auth user might be anonymous (no name/pic).
    let mergedUser = u;
    if (discordSession.value) {
        mergedUser = {
            ...u,
            displayName: discordSession.value.displayName || u?.displayName,
            photoURL: discordSession.value.photoURL || u?.photoURL,
        } as User;
    }

    user.value = mergedUser;
    if (mergedUser) {
        await fetchLinkedPlayerInternal(mergedUser.uid);
        // Sync avatar from session/auth -> player
        const currentPhoto = mergedUser.photoURL;
        if (currentPhoto && linkedPlayer.value && linkedPlayer.value.avatarUrl !== currentPhoto) {
            try {
                const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', linkedPlayer.value.id);
                await updateDoc(playerRef, { avatarUrl: currentPhoto });
                linkedPlayer.value = { ...linkedPlayer.value, avatarUrl: currentPhoto };
            } catch {}
        }
    } else {
        linkedPlayer.value = null;
    }
    loading.value = false;
});

export function useAuth() {
    const isDiscordUser = computed(() => !!discordSession.value);

    const loginWithDiscord = async () => {
        loginError.value = null;
        // Discord OAuth via Vercel (free tier)
        const vercelUrl = import.meta.env.VITE_DISCORD_OAUTH_URL || 'https://raggooner-oauth.vercel.app';
        const loginUrl = `${vercelUrl}/api/discord-login?action=start`;

        const state = Math.random().toString(36).substring(2);
        window.location.href = `${loginUrl}&state=${state}`;
    };

    const logout = async () => {
        try {
            await signOut(auth);
            saveSession(null);
            await signInAnonymously(auth);
        } catch (e) {
            console.error('Logout failed:', e);
        }
    };

    const linkToPlayer = async (globalPlayer: GlobalPlayer) => {
        if (!user.value && !discordSession.value) throw new Error('Must be logged in to link a player');

        const session = discordSession.value;
        const sessionDiscordId = session?.discordId;

        try {
            const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', globalPlayer.id);
            const updateData: Partial<GlobalPlayer> = {
                firebaseUid: user.value?.uid || session?.uid,
                discordId: sessionDiscordId || globalPlayer.discordId,
                avatarUrl: user.value?.photoURL || session?.photoURL || globalPlayer.avatarUrl,
            };

            await updateDoc(playerRef, updateData);

            // Update the Discord session
            if (session) {
                saveSession({ ...session, ...updateData } as DiscordSession);
            }

            // Re-fetch the player so we have the latest data from Firestore
            await fetchLinkedPlayerInternal(user.value?.uid || session?.uid || '');
        } catch (e) {
            console.error('Failed to link player:', e);
            throw e;
        }
    };

    const createAndLinkPlayer = async (name: string) => {
        if (!user.value && !discordSession.value) throw new Error('Must be logged in to create a player');

        const session = discordSession.value;
        const sessionDiscordId = session?.discordId;

        // CRITICAL: Check if a player with this discordId already exists before creating
        if (sessionDiscordId) {
            const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
            const q = query(playersRef, where('discordId', '==', sessionDiscordId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                // Player with this discordId already exists — link to it instead
                const existingDoc = snap.docs[0];
                if (!existingDoc) throw new Error('Unexpected empty query result');

                const existingPlayer: GlobalPlayer = { id: existingDoc.id, ...existingDoc.data() as Record<string, unknown> } as GlobalPlayer;
                const existingData = existingDoc.data();

                // Update the existing player with current uid/avatar
                const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', existingDoc.id);
                await updateDoc(playerRef, {
                    firebaseUid: user.value?.uid || session.uid,
                    avatarUrl: user.value?.photoURL || session.photoURL || existingData.avatarUrl,
                });

                linkedPlayer.value = { ...existingPlayer, firebaseUid: user.value?.uid || session.uid };
                if (session) {
                    saveSession({ ...session, uid: user.value?.uid || session.uid } as DiscordSession);
                }

                console.log('Found existing player with this discordId — linked instead of creating new');
                return existingPlayer;
            }
        }

        const playerId = crypto.randomUUID();

        const newPlayer: GlobalPlayer = {
            id: playerId,
            name,
            createdAt: new Date().toISOString(),
            firebaseUid: user.value?.uid || session?.uid,
            discordId: sessionDiscordId,
            avatarUrl: user.value?.photoURL || session?.photoURL,
            metadata: {
                totalTournaments: 0,
                totalRaces: 0
            }
        };

        try {
            const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId);
            await setDoc(playerRef, newPlayer);
            linkedPlayer.value = newPlayer;

            // Update the Discord session
            if (session) {
                saveSession({ ...session, uid: user.value?.uid || session.uid } as DiscordSession);
            }

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
        saveSession(null);
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
