import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({ auth: {}, db: {} }));

// vi.hoisted runs before both vi.mock factories AND imports, avoiding TDZ issues
const authCallbackHolder = vi.hoisted(() => ({
    fn: async (_: any) => {},
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((_, cb) => {
        authCallbackHolder.fn = cb;
        return vi.fn();
    }),
    signInWithPopup: vi.fn().mockResolvedValue({ user: {} }),
    signOut: vi.fn().mockResolvedValue(undefined),
    OAuthProvider: vi.fn(function(this: any) { this.addScope = vi.fn(); }),
    getAdditionalUserInfo: vi.fn().mockReturnValue(null),
    updateProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'colRef'),
    query: vi.fn(() => 'q'),
    where: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    doc: vi.fn(() => 'docRef'),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteField: vi.fn(() => ({ _delete: true })),
}));

import { useAuth } from './useAuth';
import { signInWithPopup, signOut } from 'firebase/auth';
import { updateDoc, setDoc } from 'firebase/firestore';
import type { GlobalPlayer } from '../types';

const makeUser = (overrides: any = {}) => ({
    uid: 'uid-123',
    displayName: 'TestUser',
    photoURL: null,
    providerData: [{ providerId: 'discord.com', uid: 'discord-123' }],
    ...overrides,
});

const makePlayer = (overrides: Partial<GlobalPlayer> = {}): GlobalPlayer => ({
    id: 'player-1',
    name: 'Player One',
    createdAt: '2024-01-01T00:00:00.000Z',
    firebaseUid: 'uid-123',
    metadata: { totalTournaments: 0, totalRaces: 0 },
    ...overrides,
});

describe('useAuth', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await authCallbackHolder.fn(null); // reset to logged-out state
    });

    // ── isDiscordUser ─────────────────────────────────────────────────────────

    describe('isDiscordUser', () => {
        it('returns falsy when not logged in', () => {
            const { isDiscordUser } = useAuth();
            expect(isDiscordUser.value).toBeFalsy();
        });

        it('returns true when user has discord.com provider', async () => {
            const { isDiscordUser } = useAuth();
            await authCallbackHolder.fn(makeUser());
            expect(isDiscordUser.value).toBe(true);
        });

        it('returns false when user has non-discord provider', async () => {
            const { isDiscordUser } = useAuth();
            await authCallbackHolder.fn(makeUser({
                providerData: [{ providerId: 'google.com', uid: 'g-123' }],
            }));
            expect(isDiscordUser.value).toBe(false);
        });
    });

    // ── loginWithDiscord ──────────────────────────────────────────────────────

    describe('loginWithDiscord', () => {
        it('calls signInWithPopup', async () => {
            const { loginWithDiscord } = useAuth();
            await loginWithDiscord();
            expect(signInWithPopup).toHaveBeenCalled();
        });

        it('sets loginError on failure', async () => {
            const err = Object.assign(new Error('some error'), { code: 'auth/unknown' });
            (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);
            const { loginWithDiscord, loginError } = useAuth();
            await loginWithDiscord();
            expect(loginError.value).toBe('Login failed. Please try again.');
        });

        it('retries once on network-request-failed and sets error if retry also fails', async () => {
            const err = Object.assign(new Error('network'), { code: 'auth/network-request-failed' });
            (signInWithPopup as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(err)
                .mockRejectedValueOnce(err);
            vi.useFakeTimers();
            const { loginWithDiscord, loginError } = useAuth();
            const p = loginWithDiscord();
            await vi.advanceTimersByTimeAsync(1500);
            await p;
            expect(loginError.value).toBe('Login failed. Please try again.');
            vi.useRealTimers();
        });

        it('retries once on service-unavailable and succeeds on retry', async () => {
            const err = Object.assign(new Error('unavail'), { code: 'auth/the-service-is-currently-unavailable' });
            (signInWithPopup as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(err)
                .mockResolvedValueOnce({ user: {} });
            vi.useFakeTimers();
            const { loginWithDiscord, loginError } = useAuth();
            const p = loginWithDiscord();
            await vi.advanceTimersByTimeAsync(1500);
            await p;
            expect(loginError.value).toBeNull();
            vi.useRealTimers();
        });

        it('does not set loginError when popup is closed by user', async () => {
            const err = Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' });
            (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);
            const { loginWithDiscord, loginError } = useAuth();
            await loginWithDiscord();
            expect(loginError.value).toBeNull();
        });

        it('updates linkedPlayer avatarUrl when profile has a picture', async () => {
            const { getAdditionalUserInfo, updateProfile } = await import('firebase/auth');
            vi.mocked(getAdditionalUserInfo).mockReturnValueOnce({
                profile: { picture: 'https://cdn.discord.com/avatar.png' },
            } as any);
            (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                user: { uid: 'uid-123' },
            });
            const { loginWithDiscord } = useAuth();
            await loginWithDiscord();
            expect(updateProfile).toHaveBeenCalledWith(
                expect.anything(),
                { photoURL: 'https://cdn.discord.com/avatar.png' }
            );
        });
    });

    // ── logout ────────────────────────────────────────────────────────────────

    describe('logout', () => {
        it('calls signOut', async () => {
            const { logout } = useAuth();
            await logout();
            expect(signOut).toHaveBeenCalled();
        });
    });

    // ── onAuthStateChanged: avatar sync ───────────────────────────────────────

    describe('avatar sync on login', () => {
        it('updates avatarUrl in Firestore when photoURL differs from stored value', async () => {
            const { linkedPlayer } = useAuth();
            // Simulate having a linked player with an old avatar
            vi.mocked(vi.fn as any); // no-op
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'player-1',
                    data: () => ({ name: 'Player One', avatarUrl: 'old-url', metadata: {} }),
                }],
            } as any);

            await authCallbackHolder.fn(makeUser({ photoURL: 'new-url' }));

            // updateDoc should have been called to sync the new avatar
            expect(updateDoc).toHaveBeenCalledWith('docRef', { avatarUrl: 'new-url' });
            expect(linkedPlayer.value?.avatarUrl).toBe('new-url');
        });

        it('skips avatar sync when photoURL matches stored value', async () => {
            const { getDocs } = await import('firebase/firestore');
            vi.mocked(getDocs).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'player-1',
                    data: () => ({ name: 'Player One', avatarUrl: 'same-url', metadata: {} }),
                }],
            } as any);

            await authCallbackHolder.fn(makeUser({ photoURL: 'same-url' }));

            expect(updateDoc).not.toHaveBeenCalled();
        });
    });

    // ── linkToPlayer ──────────────────────────────────────────────────────────

    describe('linkToPlayer', () => {
        it('throws when not logged in', async () => {
            const { linkToPlayer } = useAuth();
            await expect(linkToPlayer(makePlayer())).rejects.toThrow('Must be logged in');
        });

        it('calls updateDoc with firebaseUid and discordId', async () => {
            const { linkToPlayer, linkedPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser());

            await linkToPlayer(makePlayer());

            expect(updateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
                firebaseUid: 'uid-123',
                discordId: 'discord-123',
            }));
            expect(linkedPlayer.value?.firebaseUid).toBe('uid-123');
        });

        it('omits discordId when no discord provider data', async () => {
            const { linkToPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser({ providerData: [] }));

            await linkToPlayer(makePlayer());

            expect(updateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
                firebaseUid: 'uid-123',
                discordId: undefined,
            }));
        });

        it('rethrows on failure', async () => {
            (updateDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('permission-denied'));
            const { linkToPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser());
            await expect(linkToPlayer(makePlayer())).rejects.toThrow('permission-denied');
        });
    });

    // ── createAndLinkPlayer ───────────────────────────────────────────────────

    describe('createAndLinkPlayer', () => {
        it('throws when not logged in', async () => {
            const { createAndLinkPlayer } = useAuth();
            await expect(createAndLinkPlayer('New Player')).rejects.toThrow('Must be logged in');
        });

        it('calls setDoc and sets linkedPlayer', async () => {
            const { createAndLinkPlayer, linkedPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser());
            vi.stubGlobal('crypto', { randomUUID: () => 'uuid-123' });

            const result = await createAndLinkPlayer('New Player');

            expect(setDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
                id: 'uuid-123',
                name: 'New Player',
                firebaseUid: 'uid-123',
                discordId: 'discord-123',
            }));
            expect(result.name).toBe('New Player');
            expect(linkedPlayer.value?.name).toBe('New Player');
        });

        it('rethrows on failure', async () => {
            (setDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('quota-exceeded'));
            const { createAndLinkPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser());
            await expect(createAndLinkPlayer('Test')).rejects.toThrow('quota-exceeded');
        });
    });

    // ── unlinkOwnAccount ──────────────────────────────────────────────────────

    describe('unlinkOwnAccount', () => {
        it('throws when no linked player', async () => {
            const { unlinkOwnAccount } = useAuth();
            await expect(unlinkOwnAccount()).rejects.toThrow('No linked player');
        });

        it('calls updateDoc with deleteField for auth fields and clears linkedPlayer', async () => {
            const { unlinkOwnAccount, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer();

            await unlinkOwnAccount();

            expect(updateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
                firebaseUid: expect.anything(),
                discordId: expect.anything(),
                avatarUrl: expect.anything(),
            }));
            expect(linkedPlayer.value).toBeNull();
        });
    });

    // ── updatePlayerProfile ───────────────────────────────────────────────────

    describe('updatePlayerProfile', () => {
        it('throws when no linked player', async () => {
            const { updatePlayerProfile } = useAuth();
            await expect(updatePlayerProfile({ roster: [] })).rejects.toThrow('No linked player');
        });

        it('calls updateDoc with given fields', async () => {
            const { updatePlayerProfile, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer();

            await updatePlayerProfile({ roster: ['Uma A', 'Uma B'] });

            expect(updateDoc).toHaveBeenCalledWith('docRef', { roster: ['Uma A', 'Uma B'] });
        });

        it('merges fields into linkedPlayer', async () => {
            const { updatePlayerProfile, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer({ roster: ['Uma A'] });

            await updatePlayerProfile({ roster: ['Uma A', 'Uma B'] });

            expect(linkedPlayer.value?.roster).toEqual(['Uma A', 'Uma B']);
        });
    });

    // ── onAuthStateChanged avatar sync ────────────────────────────────────────

    describe('onAuthStateChanged avatar sync', () => {
        it('syncs avatarUrl when user has photoURL and linkedPlayer has a different avatarUrl', async () => {
            const { getDocs } = await import('firebase/firestore');
            (getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'player-1',
                    data: () => ({
                        id: 'player-1',
                        name: 'Player One',
                        firebaseUid: 'uid-123',
                        avatarUrl: 'https://old-avatar.png',
                        metadata: { totalTournaments: 0, totalRaces: 0 },
                    }),
                }],
            });

            const { linkedPlayer } = useAuth();
            await authCallbackHolder.fn(makeUser({ photoURL: 'https://new-avatar.png' }));

            expect(updateDoc).toHaveBeenCalledWith('docRef', { avatarUrl: 'https://new-avatar.png' });
            expect(linkedPlayer.value?.avatarUrl).toBe('https://new-avatar.png');
        });

        it('does NOT sync avatarUrl when user.photoURL matches linkedPlayer.avatarUrl', async () => {
            const { getDocs } = await import('firebase/firestore');
            (getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'player-1',
                    data: () => ({
                        id: 'player-1',
                        name: 'Player One',
                        firebaseUid: 'uid-123',
                        avatarUrl: 'https://same-avatar.png',
                        metadata: { totalTournaments: 0, totalRaces: 0 },
                    }),
                }],
            });

            await authCallbackHolder.fn(makeUser({ photoURL: 'https://same-avatar.png' }));

            expect(updateDoc).not.toHaveBeenCalled();
        });

        it('does NOT sync avatarUrl when user has no photoURL', async () => {
            const { getDocs } = await import('firebase/firestore');
            (getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    id: 'player-1',
                    data: () => ({
                        id: 'player-1',
                        name: 'Player One',
                        firebaseUid: 'uid-123',
                        avatarUrl: 'https://old-avatar.png',
                        metadata: { totalTournaments: 0, totalRaces: 0 },
                    }),
                }],
            });

            await authCallbackHolder.fn(makeUser({ photoURL: null }));

            expect(updateDoc).not.toHaveBeenCalled();
        });
    });

    // ── loginWithDiscord with profile picture ─────────────────────────────────

    describe('loginWithDiscord with profile picture', () => {
        it('calls updateProfile and updateDoc when profile has a picture URL and linkedPlayer exists', async () => {
            const { getAdditionalUserInfo, updateProfile } = await import('firebase/auth');

            const mockUser = makeUser({ photoURL: null });
            const mockResult = { user: mockUser };
            (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResult);
            (getAdditionalUserInfo as ReturnType<typeof vi.fn>).mockReturnValueOnce({
                profile: { picture: 'https://discord-avatar.png' }
            });

            const { loginWithDiscord, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer({ avatarUrl: 'https://old.png' });

            await loginWithDiscord();

            expect(updateProfile).toHaveBeenCalledWith(mockUser, { photoURL: 'https://discord-avatar.png' });
            expect(updateDoc).toHaveBeenCalledWith('docRef', { avatarUrl: 'https://discord-avatar.png' });
            expect(linkedPlayer.value?.avatarUrl).toBe('https://discord-avatar.png');
        });

        it('calls updateProfile but skips updateDoc when no linkedPlayer exists', async () => {
            const { getAdditionalUserInfo, updateProfile } = await import('firebase/auth');

            const mockUser = makeUser({ photoURL: null });
            (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: mockUser });
            (getAdditionalUserInfo as ReturnType<typeof vi.fn>).mockReturnValueOnce({
                profile: { picture: 'https://discord-avatar.png' }
            });

            const { loginWithDiscord } = useAuth();
            // linkedPlayer.value is null (default from beforeEach)

            await loginWithDiscord();

            expect(updateProfile).toHaveBeenCalledWith(mockUser, { photoURL: 'https://discord-avatar.png' });
            expect(updateDoc).not.toHaveBeenCalled();
        });

        it('does not call updateProfile when profile has no picture', async () => {
            const { getAdditionalUserInfo, updateProfile } = await import('firebase/auth');

            (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: makeUser() });
            (getAdditionalUserInfo as ReturnType<typeof vi.fn>).mockReturnValueOnce({ profile: {} });

            const { loginWithDiscord } = useAuth();
            await loginWithDiscord();

            expect(updateProfile).not.toHaveBeenCalled();
        });
    });

    // ── loginWithDiscord retry logic ──────────────────────────────────────────

    describe('loginWithDiscord retry logic', () => {
        it('retries once on auth/network-request-failed and succeeds on retry', async () => {
            vi.useFakeTimers();
            const networkErr = Object.assign(new Error('network'), { code: 'auth/network-request-failed' });
            (signInWithPopup as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(networkErr)
                .mockResolvedValueOnce({ user: makeUser() });

            const { loginWithDiscord, loginError } = useAuth();
            const promise = loginWithDiscord();
            await vi.runAllTimersAsync();
            await promise;

            expect(signInWithPopup).toHaveBeenCalledTimes(2);
            expect(loginError.value).toBeNull();
            vi.useRealTimers();
        });

        it('retries once on auth/the-service-is-currently-unavailable and sets loginError when retry also fails', async () => {
            vi.useFakeTimers();
            const svcErr = Object.assign(new Error('unavailable'), { code: 'auth/the-service-is-currently-unavailable' });
            (signInWithPopup as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(svcErr)
                .mockRejectedValueOnce(new Error('still failing'));

            const { loginWithDiscord, loginError } = useAuth();
            const promise = loginWithDiscord();
            await vi.runAllTimersAsync();
            await promise;

            expect(signInWithPopup).toHaveBeenCalledTimes(2);
            expect(loginError.value).toBe('Login failed. Please try again.');
            vi.useRealTimers();
        });
    });

    // ── loginWithDiscord popup-closed-by-user ─────────────────────────────────

    describe('loginWithDiscord popup closed by user', () => {
        it('does not set loginError when popup is closed by user', async () => {
            const popupErr = Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' });
            (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(popupErr);

            const { loginWithDiscord, loginError } = useAuth();
            await loginWithDiscord();

            expect(loginError.value).toBeNull();
        });

        it('does not set loginError when popup request is cancelled', async () => {
            const cancelErr = Object.assign(new Error('cancelled'), { code: 'auth/cancelled-popup-request' });
            (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValueOnce(cancelErr);

            const { loginWithDiscord, loginError } = useAuth();
            await loginWithDiscord();

            expect(loginError.value).toBeNull();
        });
    });

    // ── unlinkOwnAccount ──────────────────────────────────────────────────────

    describe('unlinkOwnAccount', () => {
        it('throws when no linked player', async () => {
            const { unlinkOwnAccount } = useAuth();
            await expect(unlinkOwnAccount()).rejects.toThrow('No linked player');
        });

        it('calls updateDoc with the correct fields for unlinking', async () => {
            const { unlinkOwnAccount, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer();

            await unlinkOwnAccount();

            expect(updateDoc).toHaveBeenCalledWith(
                'docRef',
                expect.objectContaining({
                    firebaseUid: expect.anything(),
                    discordId: expect.anything(),
                    avatarUrl: expect.anything(),
                })
            );
        });

        it('sets linkedPlayer to null after unlinking', async () => {
            const { unlinkOwnAccount, linkedPlayer } = useAuth();
            linkedPlayer.value = makePlayer();

            await unlinkOwnAccount();

            expect(linkedPlayer.value).toBeNull();
        });
    });
});
