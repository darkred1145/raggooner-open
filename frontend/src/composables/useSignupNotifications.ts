import { computed, ref, watch } from 'vue';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_ID } from '../config';
import type { NotificationPreferences, Tournament } from '../types';
import { useAuth } from './useAuth';

const NON_COMPLETED_STATUSES: Tournament['status'][] = ['track-selection', 'registration', 'draft', 'ban', 'pick', 'active'];
const LOCAL_STATE_KEY = 'signup_notification_states';

const browserNotificationSupported =
  typeof window !== 'undefined' && 'Notification' in window;

const browserPermission = ref<NotificationPermission | 'unsupported'>(
  browserNotificationSupported ? Notification.permission : 'unsupported'
);
const watchedOfficialTournaments = ref<Tournament[]>([]);
const watcherReady = ref(false);

let unsubscribe: (() => void) | null = null;
let initialized = false;

const loadStoredStates = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    return raw ? JSON.parse(raw) as Record<string, boolean> : {};
  } catch {
    return {};
  }
};

const saveStoredStates = (states: Record<string, boolean>) => {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(states));
};

const normalizePreferences = (prefs?: NotificationPreferences): Required<NotificationPreferences> => ({
  allOfficialSignups: Boolean(prefs?.allOfficialSignups),
  watchedTournamentIds: [...new Set(prefs?.watchedTournamentIds ?? [])],
});

export function useSignupNotifications() {
  const { linkedPlayer, updatePlayerProfile } = useAuth();

  const preferences = computed(() => normalizePreferences(linkedPlayer.value?.notificationPreferences));

  const watchedTournamentIds = computed(() => preferences.value.watchedTournamentIds);
  const allOfficialSignups = computed(() => preferences.value.allOfficialSignups);

  const watchedOpenSignupTournaments = computed(() =>
    watchedOfficialTournaments.value.filter(t => Boolean(t.selfSignupEnabled))
  );

  const isWatchingTournament = (tournamentId: string) =>
    allOfficialSignups.value || watchedTournamentIds.value.includes(tournamentId);

  const requestBrowserPermission = async () => {
    if (!browserNotificationSupported) return 'unsupported';
    const permission = await Notification.requestPermission();
    browserPermission.value = permission;
    return permission;
  };

  const updatePreferences = async (next: NotificationPreferences) => {
    await updatePlayerProfile({ notificationPreferences: normalizePreferences(next) });
  };

  const toggleTournamentWatch = async (tournamentId: string) => {
    const nextIds = new Set(watchedTournamentIds.value);
    if (nextIds.has(tournamentId)) nextIds.delete(tournamentId);
    else nextIds.add(tournamentId);

    await updatePreferences({
      ...preferences.value,
      watchedTournamentIds: [...nextIds],
    });
  };

  const toggleAllOfficialSignups = async () => {
    await updatePreferences({
      ...preferences.value,
      allOfficialSignups: !allOfficialSignups.value,
    });
  };

  const shouldWatchTournament = (tournament: Tournament) =>
    Boolean(tournament.isOfficial) &&
    (allOfficialSignups.value || watchedTournamentIds.value.includes(tournament.id));

  const showBrowserNotification = (tournament: Tournament) => {
    if (!browserNotificationSupported || browserPermission.value !== 'granted') return;

    const title = 'Sign-ups are now open';
    const body = `${tournament.name} is ready for self sign-up.`;
    const notification = new Notification(title, {
      body,
      tag: `signup-${tournament.id}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/t/${tournament.id}`;
      notification.close();
    };
  };

  const initializeSignupNotifications = () => {
    if (initialized) return;
    initialized = true;

    watch(
      linkedPlayer,
      () => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        watchedOfficialTournaments.value = [];
        watcherReady.value = false;

        if (!linkedPlayer.value) return;

        const tournamentsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'tournaments');
        unsubscribe = onSnapshot(
          query(tournamentsRef, where('status', 'in', NON_COMPLETED_STATUSES)),
          (snapshot) => {
            const tournaments = snapshot.docs
              .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament))
              .filter(tournament => tournament.isOfficial);

            watchedOfficialTournaments.value = tournaments
              .filter(shouldWatchTournament)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            const storedStates = loadStoredStates();
            const nextStates: Record<string, boolean> = { ...storedStates };

            watchedOfficialTournaments.value.forEach(tournament => {
              const isOpen = Boolean(tournament.selfSignupEnabled);
              const previous = storedStates[tournament.id];

              if (watcherReady.value && isOpen && previous === false) {
                showBrowserNotification(tournament);
              }

              nextStates[tournament.id] = isOpen;
            });

            watchedTournamentIds.value.forEach(id => {
              if (!watchedOfficialTournaments.value.some(t => t.id === id) && !(id in nextStates)) {
                nextStates[id] = storedStates[id] ?? false;
              }
            });

            saveStoredStates(nextStates);
            watcherReady.value = true;
          },
          (error) => {
            console.error('Signup notification watcher failed:', error);
          }
        );
      },
      { immediate: true }
    );
  };

  return {
    browserNotificationSupported,
    browserPermission,
    watchedTournamentIds,
    allOfficialSignups,
    watchedOfficialTournaments,
    watchedOpenSignupTournaments,
    isWatchingTournament,
    requestBrowserPermission,
    toggleTournamentWatch,
    toggleAllOfficialSignups,
    initializeSignupNotifications,
  };
}
