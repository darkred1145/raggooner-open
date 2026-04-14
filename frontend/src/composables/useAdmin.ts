// src/composables/useAdmin.ts
import { ref, computed, watch, type Ref } from 'vue';
import { doc, setDoc, deleteDoc, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Tournament, FirestoreUpdate } from '../types';
import { useUserRoles } from './useUserRoles';

// Define the interface for the update function to ensure type safety
type SecureUpdateFn = (data: FirestoreUpdate<Tournament>) => Promise<void>;
type FetchTournamentsFn = () => Promise<void>;


export function useAdmin(
    tournament: Ref<Tournament | null>,
    secureUpdate: SecureUpdateFn,
    fetchPublicTournaments: FetchTournamentsFn,
    appId: string
) {
    const { isSuperAdmin } = useUserRoles(); // <-- Hook into existing role logic

    // --- STATE ---
    const adminPasswordInput = ref('');
    const localAdminPassword = ref('');
    const showAdminModal = ref(false);
    const isDangerZoneOpen = ref(false);
    const isDeleting = ref(false);

    // Settings Editing State
    const editedName = ref('');
    const editedTiebreaker = ref(true);

    // --- COMPUTED ---
    const isPublicTournament = computed(() => {
        if (!tournament.value) return false;
        return !(tournament.value.isSecured || (tournament.value.password && tournament.value.password !== ''));
    });

    const isAdmin = computed(() => {
        if (!tournament.value) return false;
        if (isSuperAdmin.value) return true;
        if (isPublicTournament.value) return true;
        return localAdminPassword.value !== '';
    });

    // --- WATCHER ---
    watch(showAdminModal, (isOpen) => {
        if (isOpen && tournament.value) {
            editedName.value = tournament.value.name;
            editedTiebreaker.value = tournament.value.usePlacementTiebreaker ?? true;
        } else {
            isDangerZoneOpen.value = false;
        }
    });

    // Automatically grant Firestore access when role loads
    watch(
        [() => tournament.value?.id, isSuperAdmin, () => auth.currentUser?.uid],
        async ([tId, isSA, uid]) => {
            if (tId && isSA === true && uid && localAdminPassword.value !== 'SA') {
                await _grantAccess(tId, uid);
            }
        },
        { immediate: true }
    );

    // --- ACTIONS ---

    const loginAsAdmin = async () => {
        if (!tournament.value) return;
        if (!auth.currentUser) return;

        const pwd = adminPasswordInput.value.toUpperCase();
        const userId = auth.currentUser.uid;
        const tId = tournament.value.id;

        try {
            const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'admins', `${tId}_${userId}`);
            await setDoc(adminRef, {
                tournamentId: tId,
                userId: userId,
                password: pwd
            });

            localAdminPassword.value = pwd;
            localStorage.setItem(`admin_pwd_${tId}`, pwd);
            showAdminModal.value = false;
            adminPasswordInput.value = '';
            alert("Access Granted!");

        } catch (e: any) {
            console.error("Login failed", e);
            alert("Incorrect Password");
        }
    };

    const autoLoginIfSuperAdmin = async () => {
        // Handled automatically by reactivity.
    };

    const _grantAccess = async (tId: string, uid: string) => {
        try {
            const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'admins', `${tId}_${uid}`);
            await setDoc(adminRef, { tournamentId: tId, userId: uid, password: 'SA' });
        } catch (e) {
            console.error('Grant access failed:', e);
        }
        localAdminPassword.value = 'SA';
        localStorage.setItem(`admin_pwd_${tId}`, 'SA');
    };

    const revalidateAdminSlip = async (): Promise<boolean> => {
        if (!tournament.value || !auth.currentUser || !localAdminPassword.value) return false;
        const uid = auth.currentUser.uid;
        const tId = tournament.value.id;
        try {
            const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'admins', `${tId}_${uid}`);
            await setDoc(adminRef, { tournamentId: tId, userId: uid, password: localAdminPassword.value });
            localStorage.setItem(`admin_pwd_${tId}`, localAdminPassword.value);
            return true;
        } catch {
            return false;
        }
    };

    const copyPassword = () => {
        if (localAdminPassword.value) {
            navigator.clipboard.writeText(localAdminPassword.value);
            alert("Password copied to clipboard!");
        }
    };

    const updateTournamentName = async () => {
        if (!tournament.value || !editedName.value) return;
        await secureUpdate({ name: editedName.value });
        alert("Tournament name updated!");
    };

    const togglePlacementTiebreaker = async () => {
        if (!tournament.value) return;
        editedTiebreaker.value = !editedTiebreaker.value;
        await secureUpdate({ usePlacementTiebreaker: editedTiebreaker.value });
    };

    const getTournamentRef = (id: string) => {
        return doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', id);
    };

    const deleteTournament = async () => {
        if (!tournament.value || !isAdmin.value) return;

        const confirmed = confirm(
            `DANGER: Are you sure you want to delete "${tournament.value.name}"?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        isDeleting.value = true;
        const tid = tournament.value.id;

        try {
            const col = (name: string) => collection(db, 'artifacts', appId, 'public', 'data', name);

            await deleteDoc(doc(col('secrets'), tid)).catch(() => {});
            await deleteDoc(getTournamentRef(tid));

            const userId = auth.currentUser?.uid;
            if (userId) {
                await deleteDoc(doc(col('admins'), `${tid}_${userId}`)).catch(() => {});
            }

            sessionStorage.removeItem('active_tid');
            localStorage.removeItem(`admin_pwd_${tid}`);
            localAdminPassword.value = '';

            tournament.value = null;
            showAdminModal.value = false;

            const url = new URL(window.location.href);
            url.searchParams.delete('tid');
            window.history.pushState({}, '', url);

            await fetchPublicTournaments();

            alert("Tournament deleted successfully.");
        } catch (e) {
            console.error("Error deleting tournament:", e);
            alert("Failed to delete tournament. Check console for permissions error.");
        } finally {
            isDeleting.value = false;
        }
    };

    return {
        adminPasswordInput,
        localAdminPassword,
        showAdminModal,
        isDangerZoneOpen,
        isDeleting,
        editedName,
        editedTiebreaker,
        isAdmin,
        loginAsAdmin,
        revalidateAdminSlip,
        copyPassword,
        updateTournamentName,
        togglePlacementTiebreaker,
        deleteTournament,
        autoLoginIfSuperAdmin,
        grantAdminAccess: _grantAccess,
    };
}
