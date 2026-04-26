import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../firebase', () => ({ auth: {}, db: {} }));

const authCallbackHolder = vi.hoisted(() => ({
  fn: async (_: any) => {},
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_, cb) => {
    authCallbackHolder.fn = cb;
    return vi.fn();
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  signInAnonymously: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'colRef'),
  query: vi.fn(() => 'queryRef'),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  doc: vi.fn(() => 'docRef'),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteField: vi.fn(() => ({ _delete: true })),
}));

import { useAuth, checkDiscordSession } from './useAuth';
import { signOut, signInAnonymously } from 'firebase/auth';
import { getDocs, updateDoc, setDoc } from 'firebase/firestore';
import type { GlobalPlayer } from '../types';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  uid: 'uid-123',
  displayName: 'TestUser',
  photoURL: null,
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

const setDiscordSession = (overrides: Record<string, unknown> = {}) => {
  localStorage.setItem('discord_session', JSON.stringify({
    uid: 'uid-123',
    discordId: 'discord-123',
    displayName: 'Discord User',
    photoURL: 'https://cdn.discord.com/avatar.png',
    timestamp: Date.now(),
    ...overrides,
  }));
  checkDiscordSession();
};

describe('useAuth', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    const { logout } = useAuth();
    await logout();
    await authCallbackHolder.fn(null);
  });

  describe('isDiscordUser', () => {
    it('is false without a stored Discord session', () => {
      const { isDiscordUser } = useAuth();
      expect(isDiscordUser.value).toBe(false);
    });

    it('is true when a valid Discord session is loaded', () => {
      setDiscordSession();
      const { isDiscordUser } = useAuth();
      expect(isDiscordUser.value).toBe(true);
    });
  });

  describe('loginWithDiscord', () => {
    it('redirects to the Vercel Discord login endpoint', async () => {
      const { loginWithDiscord } = useAuth();

      await loginWithDiscord();

      expect(window.location.href).toContain('/api/discord-login?action=start&state=');
    });
  });

  describe('logout', () => {
    it('signs out, signs in anonymously, and clears the session', async () => {
      setDiscordSession();
      const { logout, isDiscordUser } = useAuth();

      await logout();

      expect(signOut).toHaveBeenCalled();
      expect(signInAnonymously).toHaveBeenCalled();
      expect(localStorage.getItem('discord_session')).toBeNull();
      expect(isDiscordUser.value).toBe(false);
    });
  });

  describe('onAuthStateChanged', () => {
    it('merges Discord session profile data onto the auth user', async () => {
      setDiscordSession({ displayName: 'Merged User', photoURL: 'https://cdn.discord.com/merged.png' });
      const { user } = useAuth();

      await authCallbackHolder.fn(makeUser({ displayName: null, photoURL: null }));

      expect(user.value?.displayName).toBe('Merged User');
      expect(user.value?.photoURL).toBe('https://cdn.discord.com/merged.png');
    });

    it('syncs avatarUrl when the linked player has an outdated avatar', async () => {
      setDiscordSession({ photoURL: 'https://cdn.discord.com/new.png' });
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'player-1',
          data: () => ({ name: 'Player One', avatarUrl: 'old-url', metadata: {} }),
        }],
      } as any);

      const { linkedPlayer } = useAuth();
      await authCallbackHolder.fn(makeUser({ photoURL: null }));

      expect(updateDoc).toHaveBeenCalledWith('docRef', { avatarUrl: 'https://cdn.discord.com/new.png' });
      expect(linkedPlayer.value?.avatarUrl).toBe('https://cdn.discord.com/new.png');
    });
  });

  describe('linkToPlayer', () => {
    it('throws when no auth user or Discord session exists', async () => {
      const { linkToPlayer } = useAuth();
      await expect(linkToPlayer(makePlayer())).rejects.toThrow('Must be logged in');
    });

    it('links a player using the Discord session data', async () => {
      setDiscordSession();
      vi.mocked(getDocs)
        .mockResolvedValueOnce({ empty: true, docs: [] } as any)
        .mockResolvedValueOnce({
          empty: false,
          docs: [{
            id: 'player-1',
            data: () => ({
              name: 'Player One',
              firebaseUid: 'uid-123',
              discordId: 'discord-123',
              avatarUrl: 'https://cdn.discord.com/avatar.png',
              metadata: { totalTournaments: 0, totalRaces: 0 },
            }),
          }],
        } as any);

      const { linkToPlayer, linkedPlayer } = useAuth();
      await authCallbackHolder.fn(makeUser());
      await linkToPlayer(makePlayer());

      expect(updateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        firebaseUid: 'uid-123',
        discordId: 'discord-123',
        avatarUrl: 'https://cdn.discord.com/avatar.png',
      }));
      expect(linkedPlayer.value?.discordId).toBe('discord-123');
    });
  });

  describe('createAndLinkPlayer', () => {
    it('creates a new player and stores it locally', async () => {
      setDiscordSession();
      vi.stubGlobal('crypto', { randomUUID: () => 'uuid-123' });

      const { createAndLinkPlayer, linkedPlayer } = useAuth();
      await authCallbackHolder.fn(makeUser());

      const result = await createAndLinkPlayer('New Player');

      expect(setDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
        id: 'uuid-123',
        name: 'New Player',
        firebaseUid: 'uid-123',
        discordId: 'discord-123',
        avatarUrl: 'https://cdn.discord.com/avatar.png',
      }));
      expect(result.name).toBe('New Player');
      expect(linkedPlayer.value?.name).toBe('New Player');
    });
  });

  describe('unlinkOwnAccount', () => {
    it('throws when no linked player exists', async () => {
      const { unlinkOwnAccount } = useAuth();
      await expect(unlinkOwnAccount()).rejects.toThrow('No linked player');
    });

    it('clears auth fields and resets linkedPlayer', async () => {
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

  describe('updatePlayerProfile', () => {
    it('throws when there is no linked player', async () => {
      const { updatePlayerProfile } = useAuth();
      await expect(updatePlayerProfile({ roster: [] })).rejects.toThrow('No linked player');
    });

    it('writes profile fields and merges them locally', async () => {
      const { updatePlayerProfile, linkedPlayer } = useAuth();
      linkedPlayer.value = makePlayer({ roster: ['Uma A'] });

      await updatePlayerProfile({ roster: ['Uma A', 'Uma B'] });

      expect(updateDoc).toHaveBeenCalledWith('docRef', { roster: ['Uma A', 'Uma B'] });
      expect(linkedPlayer.value?.roster).toEqual(['Uma A', 'Uma B']);
    });
  });
});
