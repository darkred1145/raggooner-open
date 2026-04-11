import { ref } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_ID } from '../config';
import type { GlobalSettings } from '../types';
import { POINTS_SYSTEM } from '../utils/constants';
import { DEFAULT_ANNOUNCEMENT_RULES } from '../utils/announcementUtils';

const appId = APP_ID;

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
    pointsSystem: { ...POINTS_SYSTEM },
    announcementTemplate: { ...DEFAULT_ANNOUNCEMENT_RULES },
    defaultSelfSignupEnabled: false,
    defaultCaptainActionsEnabled: false,
    defaultUsePlacementTiebreaker: true,
    defaultFormat: 'uma-draft',
};

// Module-level singleton
const settings = ref<GlobalSettings>({ ...DEFAULT_GLOBAL_SETTINGS });
const loading = ref(true);
let initPromise: Promise<void> | null = null;

function initSettings(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        try {
            const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'));
            if (snap.exists()) {
                settings.value = { ...DEFAULT_GLOBAL_SETTINGS, ...(snap.data() as GlobalSettings) };
            }
        } catch (e) {
            console.error('[GlobalSettings] Failed to load:', e);
        } finally {
            loading.value = false;
        }
    })();
    return initPromise;
}

// Load immediately on module import
initSettings();

export function useGlobalSettings() {
    const save = async (updated: GlobalSettings) => {
        const payload = { ...updated, updatedAt: new Date().toISOString() };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'), payload);
        settings.value = updated;
    };

    return { settings, loading, save };
}
