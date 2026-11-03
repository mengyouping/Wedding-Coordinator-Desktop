import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '../../config/appConfig';
import { initialWeddingDatabase } from '../../data/seed';
import type { WeddingDatabase } from '../../types/domain';
import { deleteJsonSnapshot, loadJsonSnapshot, parseDatabase, restoreJsonBackup, saveJsonSnapshot } from './jsonFileStore';

// Only the external Tauri file boundary is mocked; migrations and validation are real.
const desktop = vi.hoisted(() => ({
  files: new Map<string, string>(),
  write: async (_path: string, _text: string): Promise<void> => {},
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { AppData: 'AppData' },
  exists: async (path: string) => path === 'projects' || desktop.files.has(path),
  mkdir: async () => {},
  readTextFile: async (path: string) => {
    const text = desktop.files.get(path);
    if (text === undefined) throw new Error('Missing synthetic file');
    return text;
  },
  writeTextFile: (path: string, text: string) => desktop.write(path, text),
  remove: async (path: string) => { desktop.files.delete(path); },
}));

function snapshot(name: string, projectId = 'synthetic-project'): WeddingDatabase {
  const result = parseDatabase(structuredClone(initialWeddingDatabase));
  result.projectId = projectId;
  result.settings.projectName = name;
  return result;
}

for (const mode of ['browser', 'tauri'] as const) {
  describe(`${mode} snapshot backup safety`, () => {
    const projectId = 'synthetic-project';
    const primary = mode === 'tauri' ? `projects/${projectId}.json` : `${appConfig.localStorageKey}.${projectId}`;
    const backup = mode === 'tauri' ? `projects/${projectId}.backup.json` : `${primary}.backup`;
    let storage: Map<string, string>;
    let failPath: string | undefined;
    let failOnce: boolean;
    let writes: string[];

    beforeEach(() => {
      storage = new Map();
      writes = [];
      failPath = undefined;
      failOnce = false;
      desktop.files = storage;
      const write = (path: string, text: string) => {
        writes.push(path);
        if (path === failPath) {
          if (failOnce) failPath = undefined;
          throw new Error('Synthetic write failure');
        }
        storage.set(path, text);
      };
      desktop.write = async (path, text) => { write(path, text); };
      vi.stubGlobal('window', mode === 'tauri' ? { __TAURI_INTERNALS__: {} } : {});
      vi.stubGlobal('localStorage', {
        getItem: (path: string) => storage.get(path) ?? null,
        setItem: write,
        removeItem: (path: string) => { storage.delete(path); },
      });
      storage.set(primary, JSON.stringify(snapshot('current')));
      storage.set(backup, JSON.stringify(snapshot('previous')));
    });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('restores without rotating or changing the original backup bytes', async () => {
      const originalBackup = storage.get(backup);
      const result = await restoreJsonBackup(projectId);
      expect(result.settings.projectName).toBe('previous');
      expect(JSON.parse(storage.get(primary)!).settings.projectName).toBe('previous');
      expect(storage.get(backup)).toBe(originalBackup);
      expect(writes).toEqual([primary]);
    });

    it('keeps the good backup when restoring over corrupt primary fails', async () => {
      storage.set(primary, 'INVALID_JSON');
      const originalBackup = storage.get(backup);
      failPath = primary;
      await expect(restoreJsonBackup(projectId)).rejects.toThrow('Synthetic write failure');
      expect(storage.get(primary)).toBe('INVALID_JSON');
      expect(storage.get(backup)).toBe(originalBackup);
      failPath = undefined;
      await expect(restoreJsonBackup(projectId)).resolves.toMatchObject({ settings: { projectName: 'previous' } });
    });

    it('restores when there is no primary snapshot', async () => {
      storage.delete(primary);
      const originalBackup = storage.get(backup);
      await restoreJsonBackup(projectId);
      expect(JSON.parse(storage.get(primary)!).settings.projectName).toBe('previous');
      expect(storage.get(backup)).toBe(originalBackup);
    });

    it('does not touch the backup write path during restore', async () => {
      failPath = backup;
      await expect(restoreJsonBackup(projectId)).resolves.toMatchObject({ settings: { projectName: 'previous' } });
    });

    for (const invalid of ['INVALID_JSON', '', '{}']) {
      it(`rejects ordinary save over invalid primary ${JSON.stringify(invalid)}`, async () => {
        storage.set(primary, invalid);
        const originalBackup = storage.get(backup);
        await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow();
        expect(storage.get(primary)).toBe(invalid);
        expect(storage.get(backup)).toBe(originalBackup);
        expect(writes).toEqual([]);
      });
    }

    it('rejects ordinary save over another project without changing either copy', async () => {
      storage.set(primary, JSON.stringify(snapshot('foreign', 'another-project')));
      const originals = [...storage];
      await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('rejects restore of a valid backup belonging to another project', async () => {
      storage.set(backup, JSON.stringify(snapshot('foreign', 'another-project')));
      const originals = [...storage];
      await expect(restoreJsonBackup(projectId)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('does not restore over a primary that explicitly belongs to another project', async () => {
      storage.set(primary, JSON.stringify(snapshot('foreign', 'another-project')));
      const originals = [...storage];
      await expect(restoreJsonBackup(projectId)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('rejects restore of an invalid backup before any write', async () => {
      storage.set(backup, 'INVALID_JSON');
      const originals = [...storage];
      await expect(restoreJsonBackup(projectId)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
      expect(writes).toEqual([]);
    });

    it('does not write anything when backup is missing', async () => {
      storage.delete(backup);
      await expect(restoreJsonBackup(projectId)).rejects.toThrow();
      expect(writes).toEqual([]);
    });

    it('rotates the exact valid previous primary on ordinary save', async () => {
      const originalPrimary = storage.get(primary);
      await saveJsonSnapshot(snapshot('new'));
      expect(storage.get(backup)).toBe(originalPrimary);
      expect(JSON.parse(storage.get(primary)!).settings.projectName).toBe('new');
    });

    it('leaves the primary unchanged if rotating the backup fails first', async () => {
      const originals = [...storage];
      failPath = backup;
      await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow('Synthetic write failure');
      expect([...storage]).toEqual(originals);
      expect(writes).toEqual([backup]);
    });

    it('retains a valid prior primary in backup if the new primary write fails', async () => {
      const originalPrimary = storage.get(primary);
      failPath = primary;
      await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow('Synthetic write failure');
      expect(storage.get(backup)).toBe(originalPrimary);
      expect(storage.get(primary)).toBe(originalPrimary);
    });

    it('rejects an invalid new snapshot before changing existing data', async () => {
      const invalid = snapshot('new');
      invalid.profile.groomName = '';
      const originals = [...storage];
      await expect(saveJsonSnapshot(invalid)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('serializes the new snapshot before rotating any backup', async () => {
      const cyclic = snapshot('new');
      (cyclic.settings as unknown as Record<string, unknown>).cycle = cyclic.settings;
      const originals = [...storage];
      await expect(saveJsonSnapshot(cyclic)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
      expect(writes).toEqual([]);
    });

    it('rejects semantically invalid primary data even when its JSON parses', async () => {
      const invalid = snapshot('invalid');
      invalid.guests.push({ ...invalid.guests[0]! });
      storage.set(primary, JSON.stringify(invalid));
      const originals = [...storage];
      await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow('重复');
      expect([...storage]).toEqual(originals);
    });

    for (const schemaVersion of [3, 4]) {
      it(`does not let migration hide malformed collections in schema ${schemaVersion}`, async () => {
        const invalid = { ...snapshot('invalid'), schemaVersion, auditLogs: { invalid: true } };
        storage.set(primary, JSON.stringify(invalid));
        const originals = [...storage];
        await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow();
        expect([...storage]).toEqual(originals);
        expect(writes).toEqual([]);
      });
    }

    it('does not normalize an unsupported stored schema into a valid backup', async () => {
      storage.set(primary, JSON.stringify({ ...snapshot('future'), schemaVersion: 999 }));
      const originals = [...storage];
      await expect(saveJsonSnapshot(snapshot('new'))).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('rejects a backup with missing project identity rather than inventing one', async () => {
      const invalid: Partial<WeddingDatabase> = snapshot('backup');
      delete invalid.projectId;
      storage.set(backup, JSON.stringify(invalid));
      const originals = [...storage];
      await expect(restoreJsonBackup(projectId)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('rejects a foreign scoped snapshot during load rather than relabeling it', async () => {
      storage.set(primary, JSON.stringify(snapshot('foreign', 'another-project')));
      storage.delete(backup);
      const originals = [...storage];
      await expect(loadJsonSnapshot(projectId)).rejects.toThrow();
      expect([...storage]).toEqual(originals);
    });

    it('serializes same-project save then restore including the backup read', async () => {
      await Promise.all([saveJsonSnapshot(snapshot('new')), restoreJsonBackup(projectId)]);
      expect(JSON.parse(storage.get(primary)!).settings.projectName).toBe('current');
      expect(JSON.parse(storage.get(backup)!).settings.projectName).toBe('current');
    });

    it('serializes same-project restore then save', async () => {
      await Promise.all([restoreJsonBackup(projectId), saveJsonSnapshot(snapshot('new'))]);
      expect(JSON.parse(storage.get(primary)!).settings.projectName).toBe('new');
      expect(JSON.parse(storage.get(backup)!).settings.projectName).toBe('previous');
    });

    it('continues the queue after an earlier operation rejects', async () => {
      const failed = saveJsonSnapshot({ ...snapshot('invalid'), revision: Number.NaN });
      const next = restoreJsonBackup(projectId);
      await expect(failed).rejects.toThrow();
      await expect(next).resolves.toMatchObject({ settings: { projectName: 'previous' } });
    });

    it('runs an already-queued restore after an actual storage write failure', async () => {
      failPath = primary;
      failOnce = true;
      const failed = saveJsonSnapshot(snapshot('failed'));
      const recovered = restoreJsonBackup(projectId);
      await expect(failed).rejects.toThrow('Synthetic write failure');
      await expect(recovered).resolves.toMatchObject({ settings: { projectName: 'current' } });
      expect(JSON.parse(storage.get(backup)!).settings.projectName).toBe('current');
    });

    it('does not resurrect a project through an in-flight save after queued deletion', async () => {
      await Promise.all([saveJsonSnapshot(snapshot('new')), deleteJsonSnapshot(projectId)]);
      expect(storage.has(primary)).toBe(false);
      expect(storage.has(backup)).toBe(false);
    });

    if (mode === 'browser') {
      it('rejects a foreign backup when automatically falling back from corrupt primary', async () => {
        storage.set(primary, 'INVALID_JSON');
        storage.set(backup, JSON.stringify(snapshot('foreign', 'another-project')));
        const originals = [...storage];
        await expect(loadJsonSnapshot(projectId)).rejects.toThrow();
        expect([...storage]).toEqual(originals);
      });

      it('retains the existing one-time legacy migration and does not resurrect it after deletion', async () => {
        const legacyKey = appConfig.legacyLocalStorageKeys[0];
        storage.set(legacyKey, JSON.stringify({ ...snapshot('legacy'), schemaVersion: 3 }));
        const loaded = await loadJsonSnapshot(appConfig.defaultProjectId);
        expect(loaded.settings.projectName).toBe('legacy');
        expect(loaded.projectId).toBe(appConfig.defaultProjectId);
        await deleteJsonSnapshot(appConfig.defaultProjectId);
        const recreated = await loadJsonSnapshot(appConfig.defaultProjectId);
        expect(recreated.settings.projectName).not.toBe('legacy');
      });

      it('preserves the original legacy bytes if migration cannot write its new primary', async () => {
        const legacyKey = appConfig.legacyLocalStorageKeys[0];
        const legacy = JSON.stringify({ ...snapshot('legacy'), schemaVersion: 3 });
        storage.set(legacyKey, legacy);
        failPath = `${appConfig.localStorageKey}.${appConfig.defaultProjectId}`;
        await expect(loadJsonSnapshot(appConfig.defaultProjectId)).rejects.toThrow('Synthetic write failure');
        expect(storage.get(legacyKey)).toBe(legacy);
      });
    }

    if (mode === 'tauri') {
      it('keeps independent projects writable while one project write is waiting', async () => {
        let release!: () => void;
        let entered!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const started = new Promise<void>(resolve => { entered = resolve; });
        const normalWrite = desktop.write;
        desktop.write = async (path, text) => {
          if (path === primary) { entered(); await gate; }
          await normalWrite(path, text);
        };
        const blocked = saveJsonSnapshot(snapshot('waiting'));
        await started;
        try {
          await saveJsonSnapshot(snapshot('independent', 'another-project'));
          expect(JSON.parse(storage.get('projects/another-project.json')!).settings.projectName).toBe('independent');
        } finally { release(); await blocked; }
      });

      it('preserves the backup when a failed restore truncates the primary file', async () => {
        const originalBackup = storage.get(backup);
        desktop.write = async (path, text) => {
          if (path === primary) { storage.set(path, text.slice(0, 12)); throw new Error('Partial write'); }
          storage.set(path, text);
        };
        await expect(restoreJsonBackup(projectId)).rejects.toThrow('Partial write');
        expect(storage.get(backup)).toBe(originalBackup);
      });
    }
  });
}
