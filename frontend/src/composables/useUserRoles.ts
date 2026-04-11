import { ref, computed } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, deleteField, collection, getDocs, updateDoc } from 'firebase/firestore';
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
        // Check role by UID first
        let role = await fetchRoleForUid(u.uid);

        // If player role, also check by Discord ID from localStorage (dev mode)
        if (role === 'player') {
            try {
                const raw = localStorage.getItem('discord_session');
                if (raw) {
                    const session = JSON.parse(raw);
                    if (session?.discordId) {
                        const discordRole = await fetchRoleByDiscordId(session.discordId);
                        if (discordRole !== 'player') role = discordRole;
                    }
                }
            } catch {}
        }

        currentUserRole.value = role;
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
    const isSuperAdmin = computed(() => currentUserRole.value === 'superadmin');

    // True for both admin and superadmin
    const isAdmin = computed(() => currentUserRole.value === 'admin' || isSuperAdmin.value);

    // Check a permission for the current user
    const can = (permission: Permission): boolean => hasPermission(currentUserRole.value, permission);

    const isOfficialCreator = computed(() => can('create_official_tournament'));

    const setUserRole = async (targetUid: string, role: UserRole, displayName?: string) => {
        if (!can('manage_users')) throw new Error('Only admins can set roles');
        if (role === 'superadmin' && !can('promote_to_superadmin')) {
            throw new Error('Only superadmins can promote to superadmin');
        }
        const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'userRoles', targetUid);
        if (role === 'player') {
            await deleteDoc(roleRef);
        } else {
            await setDoc(roleRef, { uid: targetUid, role, displayName: displayName ?? '', updatedAt: new Date().toISOString() });
        }
    };

    const fetchAllRoles = async (): Promise<UserRoleEntry[]> => {
        if (!can('manage_users')) return [];
        const rolesRef = collection(db, 'artifacts', appId, 'public', 'data', 'userRoles');
        const snap = await getDocs(rolesRef);
        return snap.docs.map(d => ({
            uid: d.id,
            role: d.data().role as UserRole,
            displayName: d.data().displayName,
        }));
    };

    const unlinkPlayer = async (playerId: string) => {
        if (!can('unlink_player')) throw new Error('Only superadmins can unlink players');
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
