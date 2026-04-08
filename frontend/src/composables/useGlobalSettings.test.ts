import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../firebase', () => ({ db: {} }));
vi.mock('../utils/constants', () => ({
  POINTS_SYSTEM: { 1: 25, 2: 18, 3: 15 },
}));
vi.mock('../utils/announcementUtils', () => ({
  DEFAULT_ANNOUNCEMENT_RULES: { umaDraft: 'draft template', umaBan: 'ban template' },
}));

import { setDoc } from 'firebase/firestore';
import { useGlobalSettings, DEFAULT_GLOBAL_SETTINGS } from './useGlobalSettings';

describe('useGlobalSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── DEFAULT_GLOBAL_SETTINGS ───────────────────────────────────────────────

  describe('DEFAULT_GLOBAL_SETTINGS', () => {
    it('has all required fields', () => {
      expect(DEFAULT_GLOBAL_SETTINGS).toMatchObject({
        pointsSystem: expect.any(Object),
        announcementTemplate: expect.objectContaining({
          umaDraft: expect.any(String),
          umaBan: expect.any(String),
        }),
        defaultSelfSignupEnabled: expect.any(Boolean),
        defaultCaptainActionsEnabled: expect.any(Boolean),
        defaultUsePlacementTiebreaker: expect.any(Boolean),
        defaultFormat: expect.any(String),
      });
    });

    it('defaults to uma-draft format', () => {
      expect(DEFAULT_GLOBAL_SETTINGS.defaultFormat).toBe('uma-draft');
    });

    it('defaults placement tiebreaker to true', () => {
      expect(DEFAULT_GLOBAL_SETTINGS.defaultUsePlacementTiebreaker).toBe(true);
    });

    it('defaults selfSignupEnabled and captainActionsEnabled to false', () => {
      expect(DEFAULT_GLOBAL_SETTINGS.defaultSelfSignupEnabled).toBe(false);
      expect(DEFAULT_GLOBAL_SETTINGS.defaultCaptainActionsEnabled).toBe(false);
    });
  });

  // ── settings ref ─────────────────────────────────────────────────────────

  describe('settings', () => {
    it('exposes a settings ref with the default shape', () => {
      const { settings } = useGlobalSettings();
      expect(settings.value).toMatchObject({
        defaultFormat: expect.any(String),
        pointsSystem: expect.any(Object),
      });
    });
  });

  // ── save ─────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('calls setDoc with the updated settings', async () => {
      const { save } = useGlobalSettings();
      const updated = { ...DEFAULT_GLOBAL_SETTINGS, defaultFormat: 'uma-ban' };
      await save(updated);
      expect(vi.mocked(setDoc)).toHaveBeenCalledOnce();
    });

    it('includes an updatedAt ISO timestamp in the persisted payload', async () => {
      const { save } = useGlobalSettings();
      await save(DEFAULT_GLOBAL_SETTINGS);
      const [, payload] = vi.mocked(setDoc).mock.calls[0]!;
      expect(typeof (payload as any).updatedAt).toBe('string');
      expect(() => new Date((payload as any).updatedAt)).not.toThrow();
    });

    it('updates the local settings ref immediately', async () => {
      const { save, settings } = useGlobalSettings();
      const updated = { ...DEFAULT_GLOBAL_SETTINGS, defaultCaptainActionsEnabled: true };
      await save(updated);
      expect(settings.value.defaultCaptainActionsEnabled).toBe(true);
    });

    it('does not include updatedAt in the local settings ref', async () => {
      const { save, settings } = useGlobalSettings();
      await save(DEFAULT_GLOBAL_SETTINGS);
      expect('updatedAt' in settings.value).toBe(false);
    });

    it('propagates setDoc errors', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('PERMISSION_DENIED'));
      const { save } = useGlobalSettings();
      await expect(save(DEFAULT_GLOBAL_SETTINGS)).rejects.toThrow('PERMISSION_DENIED');
    });
  });

  // ── loading ───────────────────────────────────────────────────────────────

  describe('loading', () => {
    it('exposes a loading boolean ref', () => {
      const { loading } = useGlobalSettings();
      expect(typeof loading.value).toBe('boolean');
    });
  });
});

// ── initSettings branches (requires module re-import to reset singleton) ──────

describe('useGlobalSettings — initSettings branches', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('merges Firestore data over defaults when document exists', async () => {
    vi.mocked(vi.fn()).mockResolvedValue(undefined); // placeholder - getDoc set below
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ defaultFormat: 'uma-ban', defaultSelfSignupEnabled: true }),
    } as any);

    vi.resetModules();
    // After reset, re-mock so the fresh module sees the right responses
    vi.doMock('firebase/firestore', () => ({
      doc: vi.fn(() => ({})),
      getDoc: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ defaultFormat: 'uma-ban', defaultSelfSignupEnabled: true }),
      }),
      setDoc: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../firebase', () => ({ db: {} }));
    vi.doMock('../utils/constants', () => ({ POINTS_SYSTEM: { 1: 25 } }));
    vi.doMock('../utils/announcementUtils', () => ({
      DEFAULT_ANNOUNCEMENT_RULES: { umaDraft: '', umaBan: '' },
    }));

    const { useGlobalSettings } = await import('./useGlobalSettings');
    // Allow async initSettings to resolve
    await new Promise(r => setTimeout(r, 0));
    const { settings } = useGlobalSettings();
    expect(settings.value.defaultFormat).toBe('uma-ban');
    expect(settings.value.defaultSelfSignupEnabled).toBe(true);
  });

  it('swallows errors from getDoc and still sets loading to false', async () => {
    vi.resetModules();
    vi.doMock('firebase/firestore', () => ({
      doc: vi.fn(() => ({})),
      getDoc: vi.fn().mockRejectedValue(new Error('Firestore unavailable')),
      setDoc: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../firebase', () => ({ db: {} }));
    vi.doMock('../utils/constants', () => ({ POINTS_SYSTEM: { 1: 25 } }));
    vi.doMock('../utils/announcementUtils', () => ({
      DEFAULT_ANNOUNCEMENT_RULES: { umaDraft: '', umaBan: '' },
    }));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { useGlobalSettings } = await import('./useGlobalSettings');
    await new Promise(r => setTimeout(r, 0));
    const { settings, loading } = useGlobalSettings();
    // Defaults preserved and loading completed despite the error
    expect(settings.value.defaultFormat).toBe('uma-draft');
    expect(loading.value).toBe(false);
    consoleError.mockRestore();
  });
});
