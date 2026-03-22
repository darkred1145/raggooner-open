import { ref, computed } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, deleteField, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SUPERADMIN_UIDS } from '../utils/constants';
import type { UserRole, GlobalPlayer } from '../types';

const appId = 'default-app';

// Module-level singleton
const currentUid = ref<string | null>(null);
const currentUserRole = ref<UserRole | null>(null);
const roleLoading = ref(true);

onAuthStateChanged(auth, async (u) => {
    currentUid.value = u?.uid ?? null;
    if (u) {
        try {
            const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'userRoles', u.uid);
            const snap = await getDoc(roleRef);
            currentUserRole.value = snap.exists() ? (snap.data().role as UserRole) : 'player';
        } catch {
            currentUserRole.value = 'player';
        }
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
        return !!currentUid.value && SUPERADMIN_UIDS.includes(currentUid.value);
    });

    const isOfficialCreator = computed(() => {
        return isSuperAdmin.value || currentUserRole.value === 'tournament_creator';
    });

    const setUserRole = async (targetUid: string, role: UserRole, displayName?: string) => {
        if (!isSuperAdmin.value) throw new Error('Only superadmins can set roles');
        const roleRef = doc(db, 'artifacts', appId, 'public', 'data', 'userRoles', targetUid);
        if (role === 'player') {
            await deleteDoc(roleRef);
        } else {
            await setDoc(roleRef, { uid: targetUid, role, displayName: displayName ?? '', updatedAt: new Date().toISOString() });
        }
        // Also update the role field on the player document if it exists
        try {
            const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
            const allPlayers = await getDocs(playersRef);
            const playerDoc = allPlayers.docs.find(d => d.data().firebaseUid === targetUid);
            if (playerDoc) {
                await updateDoc(playerDoc.ref, { role: role === 'player' ? null : role });
            }
        } catch {
            // Non-critical — player doc role is for display only
        }
    };

    const fetchAllRoles = async (): Promise<UserRoleEntry[]> => {
        if (!isSuperAdmin.value) return [];
        const rolesRef = collection(db, 'artifacts', appId, 'public', 'data', 'userRoles');
        const snap = await getDocs(rolesRef);
        return snap.docs.map(d => ({
            uid: d.id,
            role: d.data().role as UserRole,
            displayName: d.data().displayName,
        }));
    };

    const unlinkPlayer = async (playerId: string) => {
        if (!isSuperAdmin.value) throw new Error('Only superadmins can unlink players');
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
        isOfficialCreator,
        setUserRole,
        unlinkPlayer,
        fetchAllRoles,
        fetchAllPlayers,
    };
}
