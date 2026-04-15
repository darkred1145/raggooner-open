import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the onAuthStateChanged callback so tests can fire auth events.
// Must use vi.hoisted() so the object is available inside the hoisted vi.mock factory.
const authState = vi.hoisted(() => ({ callback: null as ((user: any) => Promise<void>) | null }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    authState.callback = cb;
    return () => {};
  }),
}));

const { mockGetDoc, mockSetDoc, mockDeleteDoc, mockUpdateDoc, mockGetDocs } = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockGetDocs: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  updateDoc: mockUpdateDoc,
  getDocs: mockGetDocs,
  deleteField: vi.fn(() => ({ _delete: true })),
}));
vi.mock('../firebase', () => ({ auth: {}, db: {} }));

import { nextTick } from 'vue';
import { useUserRoles } from './useUserRoles';

// Helper: simulate user login and resolve role fetch
const loginAs = async (uid: string, role: string | null) => {
  if (role !== null) {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role }) });
  } else {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
  }
  await authState.callback!({ uid });
  await nextTick();
};

const logout = async () => {
  await authState.callback!(null);
  await nextTick();
};

describe('useUserRoles', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await logout();
  });

  // ── computed: isSuperAdmin, isAdmin, isOfficialCreator ────────────────────

  describe('isSuperAdmin', () => {
    it('is false when logged out', () => {
      const { isSuperAdmin } = useUserRoles();
      expect(isSuperAdmin.value).toBe(false);
    });

    it('is true only for the superadmin role', async () => {
      await loginAs('uid1', 'superadmin');
      const { isSuperAdmin } = useUserRoles();
      expect(isSuperAdmin.value).toBe(true);
    });

    it('is false for admin role', async () => {
      await loginAs('uid1', 'admin');
      const { isSuperAdmin } = useUserRoles();
      expect(isSuperAdmin.value).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('is false when logged out', () => {
      const { isAdmin } = useUserRoles();
      expect(isAdmin.value).toBe(false);
    });

    it('is true for admin role', async () => {
      await loginAs('uid1', 'admin');
      const { isAdmin } = useUserRoles();
      expect(isAdmin.value).toBe(true);
    });

    it('is true for superadmin role', async () => {
      await loginAs('uid1', 'superadmin');
      const { isAdmin } = useUserRoles();
      expect(isAdmin.value).toBe(true);
    });

    it('is false for player role', async () => {
      await loginAs('uid1', 'player');
      const { isAdmin } = useUserRoles();
      expect(isAdmin.value).toBe(false);
    });
  });

  describe('isOfficialCreator', () => {
    it('is false for player', async () => {
      await loginAs('uid1', null); // no role doc → 'player'
      const { isOfficialCreator } = useUserRoles();
      expect(isOfficialCreator.value).toBe(false);
    });

    it('is true for tournament_creator', async () => {
      await loginAs('uid1', 'tournament_creator');
      const { isOfficialCreator } = useUserRoles();
      expect(isOfficialCreator.value).toBe(true);
    });

    it('is true for admin', async () => {
      await loginAs('uid1', 'admin');
      const { isOfficialCreator } = useUserRoles();
      expect(isOfficialCreator.value).toBe(true);
    });
  });

  // ── can ───────────────────────────────────────────────────────────────────

  describe('can', () => {
    it('returns false when logged out', () => {
      const { can } = useUserRoles();
      expect(can('manage_users')).toBe(false);
    });

    it('returns true when role has the permission', async () => {
      await loginAs('uid1', 'superadmin');
      const { can } = useUserRoles();
      expect(can('promote_to_superadmin')).toBe(true);
    });

    it('returns false when role lacks the permission', async () => {
      await loginAs('uid1', 'tournament_creator');
      const { can } = useUserRoles();
      expect(can('manage_users')).toBe(false);
    });
  });

  // ── setUserRole ───────────────────────────────────────────────────────────

  describe('setUserRole', () => {
    it('throws when caller lacks manage_users', async () => {
      await loginAs('uid1', null); // player
      const { setUserRole } = useUserRoles();
      await expect(setUserRole('uid2', 'admin')).rejects.toThrow('Only admins can set roles');
    });

    it('throws when promoting to superadmin without promote_to_superadmin permission', async () => {
      await loginAs('uid1', 'admin'); // admin can manage_users but not promote_to_superadmin
      const { setUserRole } = useUserRoles();
      await expect(setUserRole('uid2', 'superadmin')).rejects.toThrow('Only superadmins can promote to superadmin');
    });

    it('calls the Vercel API to set role to player', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as any);
      await loginAs('uid1', 'superadmin');
      const { setUserRole } = useUserRoles();
      await setUserRole('uid2', 'player');
      expect(fetchSpy).toHaveBeenCalledOnce();
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(body.role).toBe('player');
      fetchSpy.mockRestore();
    });

    it('calls the Vercel API with role data for non-player roles', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as any);
      await loginAs('uid1', 'superadmin');
      const { setUserRole } = useUserRoles();
      await setUserRole('uid2', 'admin', 'TestUser');
      expect(fetchSpy).toHaveBeenCalledOnce();
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(body.role).toBe('admin');
      expect(body.displayName).toBe('TestUser');
      expect(body.targetUid).toBe('uid2');
      fetchSpy.mockRestore();
    });

    it('uses empty string for displayName when not provided', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as any);
      await loginAs('uid1', 'superadmin');
      const { setUserRole } = useUserRoles();
      await setUserRole('uid2', 'tournament_creator');
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
      expect(body.displayName).toBe('');
      fetchSpy.mockRestore();
    });
  });

  // ── fetchAllRoles ─────────────────────────────────────────────────────────

  describe('fetchAllRoles', () => {
    it('returns empty array when caller lacks manage_users', async () => {
      await loginAs('uid1', null); // player
      const { fetchAllRoles } = useUserRoles();
      const result = await fetchAllRoles();
      expect(result).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('fetches and maps role documents', async () => {
      await loginAs('uid1', 'admin');
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'uid2', data: () => ({ role: 'admin', displayName: 'Alice' }) },
          { id: 'uid3', data: () => ({ role: 'tournament_creator', displayName: 'Bob' }) },
        ],
      });
      const { fetchAllRoles } = useUserRoles();
      const result = await fetchAllRoles();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ uid: 'uid2', role: 'admin', displayName: 'Alice' });
      expect(result[1]).toEqual({ uid: 'uid3', role: 'tournament_creator', displayName: 'Bob' });
    });
  });

  // ── unlinkPlayer ──────────────────────────────────────────────────────────

  describe('unlinkPlayer', () => {
    it('throws when caller lacks unlink_player permission', async () => {
      await loginAs('uid1', 'admin'); // admin doesn't have unlink_player
      const { unlinkPlayer } = useUserRoles();
      await expect(unlinkPlayer('player1')).rejects.toThrow('Only superadmins can unlink players');
    });

    it('calls updateDoc with deleteField for auth fields', async () => {
      await loginAs('uid1', 'superadmin');
      const { unlinkPlayer } = useUserRoles();
      await unlinkPlayer('player1');
      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      const [, fields] = mockUpdateDoc.mock.calls[0]!;
      expect(fields).toMatchObject({
        firebaseUid: expect.objectContaining({ _delete: true }),
        discordId: expect.objectContaining({ _delete: true }),
        avatarUrl: expect.objectContaining({ _delete: true }),
      });
    });
  });

  // ── fetchAllPlayers ───────────────────────────────────────────────────────

  describe('fetchAllPlayers', () => {
    it('fetches and maps player documents', async () => {
      await loginAs('uid1', 'player');
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'p1', data: () => ({ name: 'Alice', metadata: {} }) },
          { id: 'p2', data: () => ({ name: 'Bob', metadata: {} }) },
        ],
      });
      const { fetchAllPlayers } = useUserRoles();
      const players = await fetchAllPlayers();
      expect(players).toHaveLength(2);
      expect(players[0]).toMatchObject({ id: 'p1', name: 'Alice' });
      expect(players[1]).toMatchObject({ id: 'p2', name: 'Bob' });
    });
  });

  // ── role fallback when Firestore errors ───────────────────────────────────

  describe('error handling', () => {
    it('falls back to player role when role fetch throws', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('network error'));
      await authState.callback!({ uid: 'uid1' });
      await nextTick();
      const { currentUserRole } = useUserRoles();
      expect(currentUserRole.value).toBe('player');
    });
  });
});
