import { ref, computed } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteField, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { APP_ID } from '../config';
import type { UserRole, GlobalPlayer } from '../types';
import { hasPermission, type Permission } from '../utils/constants';

const appId = APP_ID;

// Module-level singleton
const currentUid = ref<string | null>(null);
const currentUserRole = ref<UserRole | null>(null);
const roleLoading = ref(true);

async function fetchRoleForUid(uid: string): Promise<UserRole> {
    try {
        const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'userRoles', uid);
        const snap = await getDoc(roleRef);
        if (snap.exists()) return snap.data().role as UserRole;
    } catch {}
    return 'player';
}

async function fetchRoleByDiscordId(discordId: string): Promise<UserRole> {
    try {
        const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'userRoles', discordId);
        const snap = await getDoc(roleRef);
        if (snap.exists()) return snap.data().role as UserRole;
    } catch {}
    return 'player';
}

onAuthStateChanged(auth, async (u) => {
    currentUid.value = u?.uid ?? null;
    if (u) {
        // 1. Check Discord ID from localStorage
        let role: UserRole | null = null;
        try {
            const raw = localStorage.getItem('discord_session');
            if (raw) {
                const session = JSON.parse(raw);
                if (session?.discordId) {
                    role = await fetchRoleByDiscordId(session.discordId);
                }
            }
        } catch {}

        // 2. If no role yet, check if current Firebase UID matches a player, then use their discordId
        if (!role || role === 'player') {
            try {
                const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
                const q = query(playersRef, where('firebaseUid', '==', u.uid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const playerData = snap.docs[0]?.data();
                    if (playerData?.discordId) {
                        role = await fetchRoleByDiscordId(playerData.discordId);
                    }
                }
            } catch {}
        }

        // 3. Last resort: check by Firebase UID directly
        if (!role || role === 'player') {
            const uidRole = await fetchRoleForUid(u.uid);
            if (uidRole !== 'player') role = uidRole;
        }

        currentUserRole.value = role ?? 'player';
    } else {
        currentUserRole.value = null;
    }
    roleLoading.value = false;
});

export interface UserRoleEntry {
    uid: string;
    role: UserRole;
    displayName?: string;
}

export function useUserRoles() {
    const isSuperAdmin = computed(() => {
        if (currentUserRole.value === 'superadmin') return true;
        const session = JSON.parse(localStorage.getItem('discord_session') || '{}');
        return session.discordId && session.discordId === import.meta.env.VITE_OWNER_DISCORD_ID;
    });
    const isAdmin = computed(() => currentUserRole.value === 'admin' || isSuperAdmin.value);
    const can = (permission: Permission): boolean => hasPermission(currentUserRole.value, permission);
    const isOfficialCreator = computed(() => can('create_official_tournament'));

    const setUserRole = async (targetUid: string, role: UserRole, displayName?: string) => {
        // FIXED: Added fallback explicitly checking the role states
        if (!isAdmin.value && !can('manage_users')) throw new Error('Only admins can set roles');
        if (role === 'superadmin' && !isSuperAdmin.value && !can('promote_to_superadmin')) {
            throw new Error('Only superadmins can promote to superadmin');
        }

        const VERCEL_API_URL = import.meta.env.VITE_DISCORD_OAUTH_URL || 'https://raggooner-discord-oauth.vercel.app';
        const session = JSON.parse(localStorage.getItem('discord_session') || '{}');

        const res = await fetch(`${VERCEL_API_URL}/api/manage-roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'setUserRole',
                appId,
                targetUid,
                role,
                displayName,
                authToken: currentUid.value,
                discordId: session.discordId
            })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to update user role');
        }
    };

    const fetchAllRoles = async (): Promise<UserRoleEntry[]> => {
        // FIXED: Added fallback explicitly checking the role states
        if (!isAdmin.value && !can('manage_users')) return [];
        const rolesRef = collection(db, 'artifacts', appId, 'public', 'data', 'userRoles');
        const snap = await getDocs(rolesRef);
        return snap.docs.map(d => ({
            uid: d.id,
            role: d.data().role as UserRole,
            displayName: d.data().displayName,
        }));
    };

    const unlinkPlayer = async (playerId: string) => {
        // FIXED: Added fallback explicitly checking the role states
        if (!isSuperAdmin.value && !can('unlink_player')) throw new Error('Only superadmins can unlink players');
        const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId);
        await updateDoc(playerRef, {
            firebaseUid: deleteField(),
            discordId: deleteField(),
            avatarUrl: deleteField(),
        });
    };

    const fetchAllPlayers = async (): Promise<GlobalPlayer[]> => {
        const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
        const snap = await getDocs(playersRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as GlobalPlayer));
    };

    return {
        currentUserRole,
        roleLoading,
        isSuperAdmin,
        isAdmin,
        can,
        isOfficialCreator,
        setUserRole,
        unlinkPlayer,
        fetchAllRoles,
        fetchAllPlayers,
    };
}
